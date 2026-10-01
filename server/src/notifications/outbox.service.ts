import { Injectable } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import { logger } from '../common/logger';
import { Prisma, type OutboundEmail } from '../generated/prisma/client';
import { PrismaService, table } from '../database/prisma.service';
import type { EmailParts } from './email-layout';
import { Mailer } from './mailer';

export interface EmailToQueue {
  readonly template: string;
  readonly to: string;
  readonly toName?: string | null;
  readonly replyTo?: string | null;
  readonly parts: EmailParts;
  readonly related?: { readonly type: string; readonly id: string };
}

type Db = Pick<PrismaService, 'outboundEmail'> | Prisma.TransactionClient;

const MAX_ATTEMPTS = 6;
/** How long a claimed message is reserved for the worker sending it. */
const LEASE = "interval '5 minutes'";
/** Mail that could not go out within this window is no longer worth sending. */
const STALE_AFTER_HOURS = 72;

@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: Mailer,
  ) {}

  get deliveryConfigured(): boolean {
    return this.mailer.configured;
  }

  /** Stores a message for delivery. Pass the transaction client to tie it to the change that caused it. */
  async enqueue(email: EmailToQueue, db: Db = this.prisma): Promise<string> {
    const row = await db.outboundEmail.create({
      data: {
        template: email.template,
        toAddress: email.to,
        toName: email.toName ?? null,
        replyTo: email.replyTo ?? null,
        subject: email.parts.subject,
        html: email.parts.html,
        text: email.parts.text,
        relatedType: email.related?.type,
        relatedId: email.related?.id,
      },
      select: { id: true },
    });
    return row.id;
  }

  /**
   * Sends the given messages after the HTTP response has gone out. On Vercel,
   * `waitUntil` keeps the function alive until delivery finishes; anything that
   * fails is retried by the scheduled job.
   */
  deliverInBackground(ids: string[]): void {
    if (ids.length === 0 || !this.mailer.configured) {
      return;
    }
    const work = this.deliver(ids).catch((error) => logger.error({ msg: 'Background email delivery failed', err: error }));
    waitUntil(work);
  }

  /** Delivers due messages — specific ones, or the oldest due batch. Returns how many were sent. */
  async deliver(ids?: string[], batchSize = 25): Promise<{ sent: number; failed: number; expired: number }> {
    const expired = await this.expireStale();
    if (!this.mailer.configured) {
      return { sent: 0, failed: 0, expired };
    }

    const claimed = await this.claim(ids, batchSize);
    let sent = 0;
    let failed = 0;
    for (const email of claimed) {
      const result = await this.mailer.send({
        id: email.id,
        to: email.toAddress,
        toName: email.toName,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      if (result.ok) {
        sent += 1;
        await this.prisma.outboundEmail.update({
          where: { id: email.id },
          data: { status: 'SENT', sentAt: new Date(), providerMessageId: result.providerMessageId, lastError: null },
        });
        continue;
      }

      failed += 1;
      const exhausted = !result.retryable || email.attempts >= MAX_ATTEMPTS;
      // Exponential backoff: 2, 4, 8, 16, 32 minutes.
      const delayMinutes = 2 ** Math.min(email.attempts, 5);
      await this.prisma.outboundEmail.update({
        where: { id: email.id },
        data: {
          status: exhausted ? (result.retryable ? 'FAILED' : 'UNDELIVERABLE') : 'PENDING',
          lastError: result.error,
          nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
        },
      });
      logger.warn({ msg: 'Email delivery failed', emailId: email.id, template: email.template, error: result.error, exhausted });
    }
    return { sent, failed, expired };
  }

  /**
   * Claims due messages for this worker. `FOR UPDATE SKIP LOCKED` lets the
   * scheduled job and in-request delivery run at the same moment without ever
   * picking the same message; the lease pushes it out of everyone else's view.
   */
  private async claim(ids: string[] | undefined, batchSize: number): Promise<OutboundEmail[]> {
    const filter = ids?.length ? Prisma.sql`AND "id" = ANY(${ids}::uuid[])` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE ${table('outbound_emails')}
      SET "attempts" = "attempts" + 1,
          "next_attempt_at" = now() + ${Prisma.raw(LEASE)}
      WHERE "id" IN (
        SELECT "id" FROM ${table('outbound_emails')}
        WHERE "status" = 'PENDING' AND "next_attempt_at" <= now() ${filter}
        ORDER BY "next_attempt_at"
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id"
    `;
    if (rows.length === 0) {
      return [];
    }
    return this.prisma.outboundEmail.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async expireStale(): Promise<number> {
    const result = await this.prisma.outboundEmail.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(Date.now() - STALE_AFTER_HOURS * 3_600_000) },
      },
      data: {
        status: 'UNDELIVERABLE',
        lastError: `Not delivered within ${STALE_AFTER_HOURS} hours; too old to send.`,
      },
    });
    return result.count;
  }

  async stats(): Promise<{ pending: number; failed: number; sentLast24h: number }> {
    const since = new Date(Date.now() - 86_400_000);
    const [pending, failed, sentLast24h] = await Promise.all([
      this.prisma.outboundEmail.count({ where: { status: 'PENDING' } }),
      this.prisma.outboundEmail.count({ where: { status: { in: ['FAILED', 'UNDELIVERABLE'] }, createdAt: { gte: since } } }),
      this.prisma.outboundEmail.count({ where: { status: 'SENT', sentAt: { gte: since } } }),
    ]);
    return { pending, failed, sentLast24h };
  }
}
