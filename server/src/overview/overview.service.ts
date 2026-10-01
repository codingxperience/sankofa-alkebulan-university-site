import { Injectable } from '@nestjs/common';
import { badRequest } from '../common/http/errors';
import { Prisma } from '../generated/prisma/client';
import { PrismaService, table } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';

export type DaybookKind = 'inquiry' | 'application' | 'registration' | 'order';

interface DaybookRow {
  kind: DaybookKind;
  id: string;
  at: Date;
  ref: string;
  who: string | null;
  title: string | null;
  detail: string | null;
  status: string;
}

const KIND_PERMISSION: Record<DaybookKind, string> = {
  inquiry: 'inquiries.read',
  application: 'applications.read',
  registration: 'events.read',
  order: 'store.read',
};

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  private kindsFor(staff: StaffPrincipal): DaybookKind[] {
    return (Object.keys(KIND_PERMISSION) as DaybookKind[]).filter((kind) =>
      staff.permissions.has(KIND_PERMISSION[kind] as never),
    );
  }

  /** The numbers on the console's first screen — only those this person is allowed to see. */
  async summary(staff: StaffPrincipal) {
    const kinds = new Set(this.kindsFor(staff));
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 86_400_000);

    const [inquiries, applications, registrations, orders, subscribers] = await Promise.all([
      kinds.has('inquiry')
        ? Promise.all([
            this.prisma.inquiry.count({ where: { status: 'NEW' } }),
            this.prisma.inquiry.count({ where: { status: { in: ['NEW', 'OPEN', 'AWAITING_REPLY'] } } }),
            this.prisma.inquiry.findMany({
              where: { status: 'NEW' },
              orderBy: { createdAt: 'asc' },
              take: 5,
              select: { id: true, reference: true, name: true, subject: true, office: true, createdAt: true },
            }),
          ]).then(([fresh, active, oldest]) => ({ new: fresh, active, oldestWaiting: oldest }))
        : null,
      kinds.has('application')
        ? Promise.all([
            this.prisma.application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
            this.prisma.application.count({ where: { status: 'DRAFT', updatedAt: { gte: since30 } } }),
            this.prisma.application.count({ where: { submittedAt: { gte: since30 } } }),
          ]).then(([awaitingDecision, inProgress, submitted30d]) => ({ awaitingDecision, inProgress, submitted30d }))
        : null,
      kinds.has('registration')
        ? this.prisma.event
            .findMany({
              where: { status: 'PUBLISHED', startsAt: { gte: now } },
              orderBy: { startsAt: 'asc' },
              take: 3,
              select: { id: true, title: true, startsAt: true, capacity: true, _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } } },
            })
            .then((events) => ({
              upcoming: events.map((event) => ({
                id: event.id,
                title: event.title,
                startsAt: event.startsAt,
                capacity: event.capacity,
                confirmed: event._count.registrations,
              })),
            }))
        : null,
      kinds.has('order')
        ? Promise.all([
            this.prisma.order.count({ where: { status: 'AWAITING_PAYMENT' } }),
            this.prisma.order.count({ where: { status: { in: ['PAID', 'FULFILLING'] } } }),
            this.prisma.order.aggregate({ where: { paymentStatus: 'PAID', paidAt: { gte: since30 } }, _sum: { totalCents: true } }),
          ]).then(([awaitingPayment, toFulfil, revenue]) => ({ awaitingPayment, toFulfil, revenue30dCents: revenue._sum.totalCents ?? 0 }))
        : null,
      staff.permissions.has('audience.read') ? this.prisma.subscriber.count({ where: { unsubscribedAt: null } }) : null,
    ]);

    return {
      inquiries,
      applications,
      events: registrations,
      store: orders,
      subscribers,
      activity: await this.dailyActivity([...kinds], 30),
    };
  }

  /**
   * Arrivals per day for the last `days` days, one series per kind of record,
   * zero-filled so a quiet day shows as a quiet day rather than a gap.
   */
  private async dailyActivity(kinds: DaybookKind[], days: number) {
    if (kinds.length === 0) {
      return { days: [], series: {} };
    }
    const sources: Record<DaybookKind, Prisma.Sql> = {
      inquiry: Prisma.sql`SELECT 'inquiry' AS kind, "created_at" AS at FROM ${table('inquiries')} WHERE "created_at" >= now() - make_interval(days => ${days})`,
      application: Prisma.sql`SELECT 'application', "submitted_at" FROM ${table('applications')} WHERE "submitted_at" >= now() - make_interval(days => ${days})`,
      registration: Prisma.sql`SELECT 'registration', "created_at" FROM ${table('event_registrations')} WHERE "created_at" >= now() - make_interval(days => ${days})`,
      order: Prisma.sql`SELECT 'order', "created_at" FROM ${table('orders')} WHERE "created_at" >= now() - make_interval(days => ${days})`,
    };
    const union = Prisma.join(kinds.map((kind) => sources[kind]), ' UNION ALL ');
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; kind: DaybookKind; count: bigint }>>`
      SELECT date_trunc('day', at AT TIME ZONE 'Africa/Kampala') AS day, kind, count(*) AS count
      FROM (${union}) AS arrivals
      GROUP BY 1, 2
    `;
    const labels: string[] = [];
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    const series: Partial<Record<DaybookKind, number[]>> = {};
    for (const kind of kinds) {
      series[kind] = labels.map(() => 0);
    }
    for (const row of rows) {
      const label = row.day.toISOString().slice(0, 10);
      const index = labels.indexOf(label);
      if (index >= 0 && series[row.kind]) {
        series[row.kind]![index] = Number(row.count);
      }
    }
    return { days: labels, series };
  }

  /**
   * The daybook: everything that has arrived at the university — messages,
   * applications, registrations, orders — in one stream, newest first.
   */
  async daybook(staff: StaffPrincipal, cursor: string | undefined, limit: number, only?: DaybookKind) {
    const allowed = this.kindsFor(staff).filter((kind) => !only || kind === only);
    if (allowed.length === 0) {
      return { items: [], nextCursor: null };
    }
    let after = Prisma.empty;
    if (cursor) {
      const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
      const at = new Date(iso ?? '');
      if (!id || Number.isNaN(at.getTime()) || !/^[0-9a-f-]{36}$/i.test(id)) {
        throw badRequest('That page link is no longer valid.', 'invalid_cursor');
      }
      after = Prisma.sql`WHERE (at, id) < (${at}::timestamptz, ${id}::uuid)`;
    }
    const sources: Record<DaybookKind, Prisma.Sql> = {
      inquiry: Prisma.sql`
        SELECT 'inquiry' AS kind, "id", "created_at" AS at, "reference" AS ref, "name" AS who,
               "subject" AS title, "office"::text AS detail, "status"::text AS status
        FROM ${table('inquiries')} WHERE "status" <> 'SPAM'`,
      application: Prisma.sql`
        SELECT 'application', "id", "submitted_at", "reference", concat_ws(' ', "given_name", "family_name"),
               "first_choice", "pathway"::text, "status"::text
        FROM ${table('applications')} WHERE "submitted_at" IS NOT NULL`,
      registration: Prisma.sql`
        SELECT 'registration', r."id", r."created_at", r."code", r."name", e."title", r."attendance_mode", r."status"::text
        FROM ${table('event_registrations')} r JOIN ${table('events')} e ON e."id" = r."event_id"`,
      order: Prisma.sql`
        SELECT 'order', "id", "created_at", "number", "customer_name", NULL, "total_cents"::text, "status"::text
        FROM ${table('orders')}`,
    };
    const union = Prisma.join(allowed.map((kind) => sources[kind]), ' UNION ALL ');
    const rows = await this.prisma.$queryRaw<DaybookRow[]>`
      SELECT * FROM (${union}) AS feed
      ${after}
      ORDER BY at DESC, id DESC
      LIMIT ${limit + 1}
    `;
    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const last = visible[visible.length - 1];
    return {
      items: visible,
      nextCursor: hasMore && last ? Buffer.from(`${new Date(last.at).toISOString()}|${last.id}`).toString('base64url') : null,
    };
  }
}
