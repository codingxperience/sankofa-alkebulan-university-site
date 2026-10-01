import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService } from '../audit/audit.service';
import { SubscribersService } from '../audience/subscribers.service';
import { hmac } from '../common/crypto/tokens';
import { randomCode, withUniqueReference } from '../common/crypto/references';
import { ApiError, notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import { logger } from '../common/logger';
import { currentRequestContext } from '../common/request-context';
import type { Event, EventRegistration, Prisma, RegistrationStatus } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation, table } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { registrationConfirmed } from '../notifications/templates';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';
import { type EventOptions, readOptions, registrationState } from './event-options';

/**
 * The words shown beside the updates checkbox. The page displays exactly this
 * text, and the same text is stored with each consent, so the record always
 * matches what the person agreed to.
 */
export function updatesConsent(eventTitle: string): string {
  return `Keep me informed about ${eventTitle} and future Sankofa Alkebulan University public programmes, by email or WhatsApp. No noise — a handful of messages a year.`;
}

export interface RegistrationInput {
  name: string;
  email: string;
  phone?: string;
  place?: string;
  organisation?: string;
  role?: string;
  attendeeCategory?: string;
  attendanceMode?: string;
  days?: string;
  interests: string[];
  question?: string;
  accessNeeds?: string;
  wantsUpdates: boolean;
  clientRequestId?: string;
  website?: string;
}

export interface EventInput {
  slug: string;
  title: string;
  summary?: string;
  venue?: string;
  timezone: string;
  startsAt: Date;
  endsAt?: Date | null;
  registrationClosesAt?: Date | null;
  capacity?: number | null;
  status: Event['status'];
  options: EventOptions;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly subscribers: SubscribersService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  // ─── Public ───────────────────────────────────────────────────────────

  async publicEvent(slug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event || event.status === 'DRAFT') {
      throw notFound('We could not find that event.');
    }
    const confirmed = await this.prisma.eventRegistration.count({ where: { eventId: event.id, status: 'CONFIRMED' } });
    return {
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      venue: event.venue,
      timezone: event.timezone,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      registrationClosesAt: event.registrationClosesAt ?? event.startsAt,
      registration: registrationState(event, confirmed),
      options: readOptions(event.options),
      consentText: updatesConsent(event.title),
    };
  }

  async register(slug: string, input: RegistrationInput) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event || event.status === 'DRAFT') {
      throw notFound('We could not find that event.');
    }
    if (input.website) {
      logger.info({ msg: 'Registration honeypot triggered', event: slug });
      return { status: 'CONFIRMED' as RegistrationStatus, code: `SC-${randomCode(6)}`, alreadyRegistered: false, confirmationEmailed: this.outbox.deliveryConfigured };
    }
    this.assertAnswersAllowed(readOptions(event.options), input);

    if (input.clientRequestId) {
      const replay = await this.prisma.eventRegistration.findUnique({ where: { clientRequestId: input.clientRequestId } });
      if (replay) {
        return { status: replay.status, code: replay.code, alreadyRegistered: false, confirmationEmailed: this.outbox.deliveryConfigured };
      }
    }

    const ip = currentRequestContext()?.ip ?? 'unknown';
    const prefix = this.codePrefix(event);
    const outcome = await withUniqueReference(
      (code) =>
        this.prisma.$transaction(async (tx) => {
          // Lock the event row: concurrent registrations queue here, so the
          // capacity check below cannot be raced past.
          await tx.$queryRaw`SELECT "id" FROM ${table('events')} WHERE "id" = ${event.id}::uuid FOR UPDATE`;
          const locked = await tx.event.findUniqueOrThrow({ where: { id: event.id } });
          const confirmed = await tx.eventRegistration.count({ where: { eventId: event.id, status: 'CONFIRMED' } });
          const state = registrationState(locked, confirmed);
          if (!state.open) {
            throw new ApiError(HttpStatus.GONE, 'registration_closed', this.closedMessage(state.reason));
          }

          const existing = await tx.eventRegistration.findUnique({
            where: { eventId_email: { eventId: event.id, email: input.email } },
          });
          if (existing && existing.status !== 'CANCELLED') {
            return { registration: existing, alreadyRegistered: true, emailIds: [] as string[] };
          }

          const status: RegistrationStatus = state.waitlist ? 'WAITLISTED' : 'CONFIRMED';
          const fields = {
            status,
            name: input.name,
            phone: input.phone,
            place: input.place,
            organisation: input.organisation,
            role: input.role,
            attendeeCategory: input.attendeeCategory,
            attendanceMode: input.attendanceMode,
            days: input.days,
            interests: input.interests,
            question: input.question,
            accessNeeds: input.accessNeeds,
            wantsUpdates: input.wantsUpdates,
            cancelledAt: null,
            submitterHash: hmac(this.config.secret, 'submitter', ip).slice(0, 32),
          };
          const registration = existing
            ? await tx.eventRegistration.update({ where: { id: existing.id }, data: { ...fields, clientRequestId: input.clientRequestId } })
            : await tx.eventRegistration.create({
                data: { ...fields, eventId: event.id, email: input.email, code, clientRequestId: input.clientRequestId },
              });

          if (input.wantsUpdates) {
            await this.subscribers.recordConsent(
              { email: input.email, name: input.name, source: 'EVENT_REGISTRATION', consentText: updatesConsent(locked.title) },
              tx,
            );
          }
          const emailId = await this.outbox.enqueue(
            {
              template: 'event.registration_confirmed',
              to: registration.email,
              toName: registration.name,
              parts: registrationConfirmed({
                name: registration.name,
                code: registration.code,
                eventTitle: locked.title,
                startsAt: locked.startsAt,
                timezone: locked.timezone,
                venue: locked.venue,
                attendanceMode: registration.attendanceMode,
                days: registration.days,
                waitlisted: status === 'WAITLISTED',
              }),
              related: { type: 'event_registration', id: registration.id },
            },
            tx,
          );
          return { registration, alreadyRegistered: false, emailIds: [emailId] };
        }),
      () => `${prefix}-${randomCode(6)}`,
      (error) => isUniqueViolation(error, 'code'),
    ).catch(async (error: unknown) => {
      if (input.clientRequestId && isUniqueViolation(error, 'client_request_id')) {
        const winner = await this.prisma.eventRegistration.findUniqueOrThrow({ where: { clientRequestId: input.clientRequestId } });
        return { registration: winner, alreadyRegistered: false, emailIds: [] as string[] };
      }
      if (isUniqueViolation(error, 'email')) {
        const existing = await this.prisma.eventRegistration.findUniqueOrThrow({
          where: { eventId_email: { eventId: event.id, email: input.email } },
        });
        return { registration: existing, alreadyRegistered: true, emailIds: [] as string[] };
      }
      throw error;
    });

    if (outcome.alreadyRegistered) {
      // The code is re-sent to the registered inbox, never shown to whoever typed the address.
      await this.resendConfirmation(event, outcome.registration);
      return { status: outcome.registration.status, alreadyRegistered: true, confirmationEmailed: this.outbox.deliveryConfigured };
    }
    this.outbox.deliverInBackground(outcome.emailIds);
    return {
      status: outcome.registration.status,
      code: outcome.registration.code,
      alreadyRegistered: false,
      confirmationEmailed: this.outbox.deliveryConfigured,
    };
  }

  // ─── Admin ────────────────────────────────────────────────────────────

  async list() {
    const events = await this.prisma.event.findMany({ orderBy: { startsAt: 'desc' } });
    const counts = await this.prisma.eventRegistration.groupBy({
      by: ['eventId', 'status'],
      _count: { _all: true },
    });
    const checkedIn = await this.prisma.eventRegistration.groupBy({
      by: ['eventId'],
      where: { checkedInAt: { not: null } },
      _count: { _all: true },
    });
    return events.map((event) => {
      const tally = (status: RegistrationStatus) =>
        counts.find((row) => row.eventId === event.id && row.status === status)?._count._all ?? 0;
      const confirmed = tally('CONFIRMED');
      return {
        ...event,
        options: readOptions(event.options),
        registration: registrationState(event, confirmed),
        counts: {
          confirmed,
          waitlisted: tally('WAITLISTED'),
          cancelled: tally('CANCELLED'),
          checkedIn: checkedIn.find((row) => row.eventId === event.id)?._count._all ?? 0,
        },
      };
    });
  }

  async detail(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw notFound('That event no longer exists.');
    }
    const live = { eventId: id, status: { not: 'CANCELLED' as const } };
    const [byStatus, byMode, byCategory, byDays, checkedIn, interests] = await Promise.all([
      this.prisma.eventRegistration.groupBy({ by: ['status'], where: { eventId: id }, _count: { _all: true } }),
      this.prisma.eventRegistration.groupBy({ by: ['attendanceMode'], where: live, _count: { _all: true } }),
      this.prisma.eventRegistration.groupBy({ by: ['attendeeCategory'], where: live, _count: { _all: true } }),
      this.prisma.eventRegistration.groupBy({ by: ['days'], where: live, _count: { _all: true } }),
      this.prisma.eventRegistration.count({ where: { eventId: id, checkedInAt: { not: null } } }),
      this.prisma.$queryRaw<Array<{ interest: string; count: bigint }>>`
        SELECT unnest("interests") AS "interest", count(*) AS "count"
        FROM ${table('event_registrations')}
        WHERE "event_id" = ${id}::uuid AND "status" <> 'CANCELLED'
        GROUP BY 1 ORDER BY 2 DESC
      `,
    ]);
    const tally = (rows: Array<Record<string, unknown> & { _count: { _all: number } }>, key: string) =>
      rows.map((row) => ({ value: (row[key] as string | null) ?? 'Not given', count: row._count._all })).sort((a, b) => b.count - a.count);
    const confirmed = byStatus.find((row) => row.status === 'CONFIRMED')?._count._all ?? 0;
    return {
      ...event,
      options: readOptions(event.options),
      registration: registrationState(event, confirmed),
      breakdown: {
        status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
        checkedIn,
        attendanceMode: tally(byMode, 'attendanceMode'),
        attendeeCategory: tally(byCategory, 'attendeeCategory'),
        days: tally(byDays, 'days'),
        interests: interests.map((row) => ({ value: row.interest, count: Number(row.count) })),
      },
    };
  }

  async create(staff: StaffPrincipal, input: EventInput) {
    try {
      const event = await this.prisma.event.create({ data: { ...input, options: input.options } });
      await this.audit.record({
        actor: actorOf(staff),
        action: 'event.created',
        entityType: 'event',
        entityId: event.id,
        summary: `${staff.name} created the event “${event.title}”.`,
      });
      return this.detail(event.id);
    } catch (error) {
      if (isUniqueViolation(error, 'slug')) {
        throw new ApiError(HttpStatus.CONFLICT, 'slug_taken', 'Another event already uses that web address.', { slug: 'Choose a different address.' });
      }
      throw error;
    }
  }

  async update(staff: StaffPrincipal, id: string, input: Partial<EventInput>) {
    const current = await this.prisma.event.findUnique({ where: { id } });
    if (!current) {
      throw notFound('That event no longer exists.');
    }
    const starts = input.startsAt ?? current.startsAt;
    const ends = input.endsAt === undefined ? current.endsAt : input.endsAt;
    if (ends && ends < starts) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'The event cannot end before it starts.', { endsAt: 'Must be after the start.' });
    }
    try {
      await this.prisma.event.update({ where: { id }, data: { ...input, options: input.options } });
    } catch (error) {
      if (isUniqueViolation(error, 'slug')) {
        throw new ApiError(HttpStatus.CONFLICT, 'slug_taken', 'Another event already uses that web address.', { slug: 'Choose a different address.' });
      }
      throw error;
    }
    const changed = Object.keys(input).filter((key) => input[key as keyof EventInput] !== undefined);
    await this.audit.record({
      actor: actorOf(staff),
      action: input.status && input.status !== current.status ? `event.${input.status.toLowerCase()}` : 'event.updated',
      entityType: 'event',
      entityId: id,
      summary: `${staff.name} updated “${current.title}” (${changed.join(', ')}).`,
    });
    return this.detail(id);
  }

  async registrations(eventId: string, query: { status?: RegistrationStatus; q?: string; cursor?: string; limit: number }) {
    const where: Prisma.EventRegistrationWhereInput = { eventId };
    if (query.status) where.status = query.status;
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { code: { equals: q.toUpperCase() } },
        { email: { contains: q.toLowerCase() } },
        { name: { contains: q, mode: 'insensitive' } },
        { organisation: { contains: q, mode: 'insensitive' } },
      ];
    }
    const rows = await this.prisma.eventRegistration.findMany({
      where: { AND: [where, afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    return toPage(rows, query.limit, ({ submitterHash: _hash, clientRequestId: _request, ...row }) => row);
  }

  async updateRegistration(
    staff: StaffPrincipal,
    eventId: string,
    registrationId: string,
    input: { status?: RegistrationStatus; checkedIn?: boolean },
  ) {
    const registration = await this.prisma.eventRegistration.findFirst({ where: { id: registrationId, eventId } });
    if (!registration) {
      throw notFound('That registration no longer exists.');
    }
    const data: Prisma.EventRegistrationUpdateInput = {};
    const changes: string[] = [];
    if (input.status && input.status !== registration.status) {
      data.status = input.status;
      data.cancelledAt = input.status === 'CANCELLED' ? new Date() : null;
      changes.push(input.status === 'CONFIRMED' && registration.status === 'WAITLISTED' ? 'confirmed from the waiting list' : `marked ${input.status.toLowerCase()}`);
    }
    if (input.checkedIn !== undefined && input.checkedIn !== Boolean(registration.checkedInAt)) {
      data.checkedInAt = input.checkedIn ? new Date() : null;
      changes.push(input.checkedIn ? 'checked in' : 'check-in undone');
    }
    if (changes.length === 0) {
      return registration;
    }
    const updated = await this.prisma.eventRegistration.update({ where: { id: registrationId }, data });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'event_registration.updated',
      entityType: 'event',
      entityId: eventId,
      summary: `${staff.name}: ${registration.name} (${registration.code}) ${changes.join(', ')}.`,
    });
    const { submitterHash: _hash, clientRequestId: _request, ...visible } = updated;
    return visible;
  }

  async exportRows(staff: StaffPrincipal, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw notFound('That event no longer exists.');
    }
    const rows = await this.prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: 'asc' } });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'event_registration.exported',
      entityType: 'event',
      entityId: eventId,
      summary: `${staff.name} exported ${rows.length} registrations for “${event.title}”.`,
    });
    return {
      event,
      headers: ['Code', 'Status', 'Name', 'Email', 'Phone', 'Country & city', 'Organisation', 'Role', 'Attending as', 'Joining', 'Days', 'Themes', 'Question', 'Access needs', 'Wants updates', 'Checked in', 'Registered at'],
      rows: rows.map((r) => [
        r.code, r.status, r.name, r.email, r.phone, r.place, r.organisation, r.role, r.attendeeCategory, r.attendanceMode,
        r.days, r.interests, r.question, r.accessNeeds, r.wantsUpdates ? 'Yes' : 'No', r.checkedInAt, r.createdAt,
      ]),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  /** At most one reminder per half hour, so the form cannot be used to flood someone's inbox. */
  private async resendConfirmation(event: Event, registration: EventRegistration): Promise<void> {
    const recent = await this.prisma.outboundEmail.count({
      where: {
        relatedType: 'event_registration',
        relatedId: registration.id,
        createdAt: { gte: new Date(Date.now() - 30 * 60_000) },
      },
    });
    if (recent > 0) {
      return;
    }
    const emailId = await this.outbox.enqueue({
      template: 'event.registration_confirmed',
      to: registration.email,
      toName: registration.name,
      parts: registrationConfirmed({
        name: registration.name,
        code: registration.code,
        eventTitle: event.title,
        startsAt: event.startsAt,
        timezone: event.timezone,
        venue: event.venue,
        attendanceMode: registration.attendanceMode,
        days: registration.days,
        waitlisted: registration.status === 'WAITLISTED',
      }),
      related: { type: 'event_registration', id: registration.id },
    });
    this.outbox.deliverInBackground([emailId]);
  }

  private assertAnswersAllowed(options: EventOptions, input: RegistrationInput): void {
    const fields: Record<string, string> = {};
    const check = (key: string, value: string | undefined, allowed: string[], label: string) => {
      if (allowed.length === 0) return;
      if (!value) fields[key] = `Choose ${label}.`;
      else if (!allowed.includes(value)) fields[key] = `That is not one of the options for ${label}.`;
    };
    check('attendeeCategory', input.attendeeCategory, options.attendeeCategories, 'what you are attending as');
    check('attendanceMode', input.attendanceMode, options.attendanceModes, 'how you will join');
    check('days', input.days, options.days, 'which day(s)');
    if (input.interests.some((interest) => !options.interests.includes(interest))) {
      fields.interests = 'One of the themes is not offered at this event.';
    }
    if (Object.keys(fields).length > 0) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', Object.values(fields)[0], fields);
    }
  }

  private codePrefix(event: Event): string {
    const initials = event.title
      .split(/\s+/)
      .filter((word) => /^[A-Za-z]/.test(word) && !['the', 'of', 'and', 'a', 'an'].includes(word.toLowerCase()))
      .map((word) => word[0].toUpperCase())
      .join('')
      .slice(0, 3);
    return (initials || 'EV') + String(event.startsAt.getUTCFullYear()).slice(2);
  }

  private closedMessage(reason: 'not_published' | 'cancelled' | 'closed' | 'ended'): string {
    switch (reason) {
      case 'cancelled':
        return 'This event has been cancelled.';
      case 'ended':
        return 'This event has already taken place.';
      case 'closed':
        return 'Registration for this event has closed.';
      default:
        return 'Registration for this event is not open.';
    }
  }
}
