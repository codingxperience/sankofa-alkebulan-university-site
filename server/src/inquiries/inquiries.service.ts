import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService } from '../audit/audit.service';
import { hmac } from '../common/crypto/tokens';
import { reference, withUniqueReference } from '../common/crypto/references';
import { ApiError, notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import { logger } from '../common/logger';
import { currentRequestContext } from '../common/request-context';
import type { InquirySource, InquiryStatus, Office, Prisma } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { inquiryReceived, inquiryReply, inquiryStaffAlert } from '../notifications/templates';
import { OfficeRoutesService } from '../settings/office-routes.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';

export interface InquirySubmission {
  office: Office;
  source: InquirySource;
  name: string;
  email: string;
  origin?: string;
  subject?: string;
  message: string;
  details?: Record<string, string>;
  clientRequestId?: string;
  website?: string;
}

export interface InquiryReceipt {
  reference: string;
  office: { key: Office; label: string; responseTarget: string };
  receivedAt: Date;
  /** Whether a copy is on its way to the sender, so the page never promises an email that will not come. */
  acknowledgementEmailed: boolean;
}

export interface InquiryListQuery {
  status?: InquiryStatus | 'ACTIVE';
  office?: Office;
  assignee?: string;
  q?: string;
  cursor?: string;
  limit: number;
}

/** A second identical message within this window is treated as a double submit. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly offices: OfficeRoutesService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  // ─── Public ───────────────────────────────────────────────────────────

  async submit(input: InquirySubmission): Promise<InquiryReceipt> {
    const route = await this.offices.get(input.office);
    const receipt = (ref: string, at: Date): InquiryReceipt => ({
      reference: ref,
      office: { key: input.office, label: route.label, responseTarget: route.responseTarget },
      receivedAt: at,
      acknowledgementEmailed: this.outbox.deliveryConfigured,
    });

    // Bots fill in the hidden field; they get an ordinary-looking answer and nothing is stored.
    if (input.website) {
      logger.info({ msg: 'Inquiry honeypot triggered', office: input.office });
      return receipt(reference('SAU-Q'), new Date());
    }

    if (input.clientRequestId) {
      const replay = await this.prisma.inquiry.findUnique({ where: { clientRequestId: input.clientRequestId } });
      if (replay) {
        return receipt(replay.reference, replay.createdAt);
      }
    }
    const duplicate = await this.prisma.inquiry.findFirst({
      where: {
        email: input.email,
        message: input.message,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) {
      return receipt(duplicate.reference, duplicate.createdAt);
    }

    const ip = currentRequestContext()?.ip ?? 'unknown';
    const { inquiry, emailIds } = await withUniqueReference(
      (ref) =>
        this.prisma.$transaction(async (tx) => {
          const created = await tx.inquiry.create({
            data: {
              reference: ref,
              office: input.office,
              source: input.source,
              name: input.name,
              email: input.email,
              origin: input.origin,
              subject: input.subject,
              message: input.message,
              details: input.details,
              clientRequestId: input.clientRequestId,
              submitterHash: hmac(this.config.secret, 'submitter', ip).slice(0, 32),
            },
          });
          const ids = [
            await this.outbox.enqueue(
              {
                template: 'inquiry.received',
                to: created.email,
                toName: created.name,
                parts: inquiryReceived({
                  name: created.name,
                  reference: created.reference,
                  officeLabel: route.label,
                  responseTarget: route.responseTarget,
                  message: created.message,
                }),
                related: { type: 'inquiry', id: created.id },
              },
              tx,
            ),
          ];
          for (const to of route.notifyEmails) {
            ids.push(
              await this.outbox.enqueue(
                {
                  template: 'inquiry.staff_alert',
                  to,
                  replyTo: created.email,
                  parts: inquiryStaffAlert({
                    reference: created.reference,
                    officeLabel: route.label,
                    name: created.name,
                    email: created.email,
                    origin: created.origin,
                    subject: created.subject,
                    message: created.message,
                    adminUrl: `${this.config.siteUrl}/admin/inbox/${created.id}`,
                  }),
                  related: { type: 'inquiry', id: created.id },
                },
                tx,
              ),
            );
          }
          return { inquiry: created, emailIds: ids };
        }),
      () => reference('SAU-Q'),
      (error) => isUniqueViolation(error, 'reference'),
    ).catch(async (error: unknown) => {
      // Two tabs submitting the same request id at once: the loser returns the winner's record.
      if (input.clientRequestId && isUniqueViolation(error, 'client_request_id')) {
        const winner = await this.prisma.inquiry.findUniqueOrThrow({ where: { clientRequestId: input.clientRequestId } });
        return { inquiry: winner, emailIds: [] as string[] };
      }
      throw error;
    });

    this.outbox.deliverInBackground(emailIds);
    return receipt(inquiry.reference, inquiry.createdAt);
  }

  // ─── Admin ────────────────────────────────────────────────────────────

  async list(staff: StaffPrincipal, query: InquiryListQuery) {
    const where: Prisma.InquiryWhereInput = {};
    if (query.status === 'ACTIVE') {
      where.status = { in: ['NEW', 'OPEN', 'AWAITING_REPLY'] };
    } else if (query.status) {
      where.status = query.status;
    }
    if (query.office) {
      where.office = query.office;
    }
    if (query.assignee === 'me') {
      where.assigneeId = staff.id;
    } else if (query.assignee === 'unassigned') {
      where.assigneeId = null;
    } else if (query.assignee) {
      where.assigneeId = query.assignee;
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { reference: { equals: q.toUpperCase() } },
        { email: { contains: q.toLowerCase() } },
        { name: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.inquiry.findMany({
      where: { AND: [where, afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: { assignee: { select: { id: true, name: true } }, _count: { select: { notes: true } } },
    });
    return toPage(rows, query.limit, (row) => ({
      id: row.id,
      reference: row.reference,
      office: row.office,
      source: row.source,
      status: row.status,
      name: row.name,
      email: row.email,
      subject: row.subject,
      preview: row.message.slice(0, 180),
      assignee: row.assignee,
      notes: row._count.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /** Counts per status and per office, for the console's navigation badges. */
  async counts() {
    const [byStatus, byOffice] = await Promise.all([
      this.prisma.inquiry.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.inquiry.groupBy({
        by: ['office'],
        where: { status: { in: ['NEW', 'OPEN', 'AWAITING_REPLY'] } },
        _count: { _all: true },
      }),
    ]);
    return {
      status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      activeByOffice: Object.fromEntries(byOffice.map((row) => [row.office, row._count._all])),
    };
  }

  async detail(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true } },
        notes: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } },
      },
    });
    if (!inquiry) {
      throw notFound('That message no longer exists.');
    }
    const [history, activity] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: { email: inquiry.email, id: { not: inquiry.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, reference: true, subject: true, status: true, office: true, createdAt: true },
      }),
      this.prisma.auditEvent.findMany({
        where: { entityType: 'inquiry', entityId: inquiry.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, actorLabel: true, action: true, summary: true, createdAt: true },
      }),
    ]);
    const { submitterHash: _hash, clientRequestId: _request, ...visible } = inquiry;
    return { ...visible, history, activity };
  }

  async update(
    staff: StaffPrincipal,
    id: string,
    input: { status?: InquiryStatus; office?: Office; assigneeId?: string | null },
  ) {
    const current = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!current) {
      throw notFound('That message no longer exists.');
    }
    if (input.assigneeId) {
      const assignee = await this.prisma.staffMember.findUnique({ where: { id: input.assigneeId } });
      if (!assignee || assignee.status !== 'ACTIVE') {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_assignee', 'That person cannot be assigned work.');
      }
    }

    const changes: string[] = [];
    const data: Prisma.InquiryUncheckedUpdateInput = {};
    if (input.status && input.status !== current.status) {
      data.status = input.status;
      data.resolvedAt = input.status === 'RESOLVED' ? new Date() : null;
      changes.push(`marked it ${input.status.toLowerCase().replace('_', ' ')}`);
    }
    if (input.office && input.office !== current.office) {
      data.office = input.office;
      const route = await this.offices.get(input.office);
      changes.push(`moved it to ${route.label}`);
    }
    if (input.assigneeId !== undefined && input.assigneeId !== current.assigneeId) {
      data.assigneeId = input.assigneeId;
      if (input.assigneeId === null) {
        changes.push('unassigned it');
      } else {
        const assignee = await this.prisma.staffMember.findUniqueOrThrow({ where: { id: input.assigneeId }, select: { name: true } });
        changes.push(input.assigneeId === staff.id ? 'took it' : `assigned it to ${assignee.name}`);
      }
    }
    if (changes.length === 0) {
      return this.detail(id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.inquiry.update({ where: { id }, data });
      await this.audit.record(
        {
          actor: actorOf(staff),
          action: 'inquiry.updated',
          entityType: 'inquiry',
          entityId: id,
          summary: `${staff.name} ${changes.join(', ')}.`,
        },
        tx,
      );
    });
    return this.detail(id);
  }

  async addNote(staff: StaffPrincipal, id: string, body: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!inquiry) {
      throw notFound('That message no longer exists.');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.inquiryNote.create({ data: { inquiryId: id, authorId: staff.id, kind: 'NOTE', body } });
      if (inquiry.status === 'NEW') {
        await tx.inquiry.update({ where: { id }, data: { status: 'OPEN' } });
      }
    });
    return this.detail(id);
  }

  /**
   * Answers the person by email from the console. The reply is kept on the
   * record, and the person's answer comes back to the university's mailbox.
   */
  async reply(staff: StaffPrincipal, id: string, body: string) {
    if (!this.outbox.deliveryConfigured) {
      throw new ApiError(
        HttpStatus.SERVICE_UNAVAILABLE,
        'email_not_configured',
        'Email sending is not set up yet, so replies cannot be sent from the console. Reply from the university mailbox instead.',
      );
    }
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) {
      throw notFound('That message no longer exists.');
    }
    if (inquiry.status === 'SPAM') {
      throw new ApiError(HttpStatus.CONFLICT, 'inquiry_is_spam', 'This message is marked as spam. Restore it before replying.');
    }
    const route = await this.offices.get(inquiry.office);

    const emailId = await this.prisma.$transaction(async (tx) => {
      const queued = await this.outbox.enqueue(
        {
          template: 'inquiry.reply',
          to: inquiry.email,
          toName: inquiry.name,
          parts: inquiryReply({
            name: inquiry.name,
            reference: inquiry.reference,
            staffName: staff.name,
            officeLabel: route.label,
            originalSubject: inquiry.subject,
            body,
          }),
          related: { type: 'inquiry', id },
        },
        tx,
      );
      await tx.inquiryNote.create({ data: { inquiryId: id, authorId: staff.id, kind: 'REPLY', body, emailId: queued } });
      await tx.inquiry.update({
        where: { id },
        data: {
          status: inquiry.status === 'RESOLVED' ? 'RESOLVED' : 'AWAITING_REPLY',
          firstRepliedAt: inquiry.firstRepliedAt ?? new Date(),
          assigneeId: inquiry.assigneeId ?? staff.id,
        },
      });
      await this.audit.record(
        {
          actor: actorOf(staff),
          action: 'inquiry.replied',
          entityType: 'inquiry',
          entityId: id,
          summary: `${staff.name} replied to ${inquiry.name} by email.`,
        },
        tx,
      );
      return queued;
    });
    this.outbox.deliverInBackground([emailId]);
    return this.detail(id);
  }
}

