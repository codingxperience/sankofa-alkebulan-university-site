import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import type { Prisma, SubscriberSource } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';

type Db = Pick<PrismaService, 'subscriber'> | Prisma.TransactionClient;

export const NEWSLETTER_CONSENT =
  'Send me the latest scholarly publications and research insights from Sankofa Alkebulan University by email. I can unsubscribe at any time.';

@Injectable()
export class SubscribersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Records that someone asked to hear from the university, keeping the exact
   * words they agreed to. A person who had unsubscribed and opts in again is
   * resubscribed with the new consent.
   */
  async recordConsent(
    input: { email: string; name?: string | null; source: SubscriberSource; consentText: string },
    db: Db = this.prisma,
  ): Promise<void> {
    const now = new Date();
    await db.subscriber.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        name: input.name ?? null,
        source: input.source,
        consentText: input.consentText,
        consentedAt: now,
      },
      update: {
        name: input.name ?? undefined,
        consentText: input.consentText,
        consentedAt: now,
        unsubscribedAt: null,
      },
    });
  }

  async list(query: { status?: 'subscribed' | 'unsubscribed'; q?: string; cursor?: string; limit: number }) {
    const where: Prisma.SubscriberWhereInput = {};
    if (query.status === 'subscribed') where.unsubscribedAt = null;
    if (query.status === 'unsubscribed') where.unsubscribedAt = { not: null };
    if (query.q) {
      where.OR = [
        { email: { contains: query.q.toLowerCase() } },
        { name: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.subscriber.findMany({
      where: { AND: [where, afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    return toPage(rows, query.limit, (row) => row);
  }

  async counts() {
    const [subscribed, unsubscribed] = await Promise.all([
      this.prisma.subscriber.count({ where: { unsubscribedAt: null } }),
      this.prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    ]);
    return { subscribed, unsubscribed };
  }

  async unsubscribe(staff: StaffPrincipal, id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) {
      throw notFound('That subscriber no longer exists.');
    }
    if (!subscriber.unsubscribedAt) {
      await this.prisma.subscriber.update({ where: { id }, data: { unsubscribedAt: new Date() } });
      await this.audit.record({
        actor: actorOf(staff),
        action: 'subscriber.unsubscribed',
        entityType: 'subscriber',
        entityId: id,
        summary: `${staff.name} unsubscribed ${subscriber.email}.`,
      });
    }
    return this.prisma.subscriber.findUniqueOrThrow({ where: { id } });
  }

  /** Permanently removes a person's record, for erasure requests. */
  async erase(staff: StaffPrincipal, id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!subscriber) {
      throw notFound('That subscriber no longer exists.');
    }
    await this.prisma.subscriber.delete({ where: { id } });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'subscriber.erased',
      entityType: 'subscriber',
      entityId: id,
      // The address itself is deliberately not kept in the log.
      summary: `${staff.name} permanently erased a subscriber record on request.`,
    });
    return { ok: true };
  }

  async exportRows(staff: StaffPrincipal) {
    const rows = await this.prisma.subscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: 'asc' } });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'subscriber.exported',
      entityType: 'subscriber',
      summary: `${staff.name} exported ${rows.length} subscriber${rows.length === 1 ? '' : 's'} to CSV.`,
    });
    return {
      headers: ['Email', 'Name', 'Source', 'Consented at', 'Consent wording'],
      rows: rows.map((row) => [row.email, row.name, row.source, row.consentedAt, row.consentText]),
    };
  }
}
