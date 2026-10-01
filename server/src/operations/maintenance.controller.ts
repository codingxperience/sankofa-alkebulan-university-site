import { Controller, Get, Headers, HttpCode } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { safeEqual } from '../common/crypto/tokens';
import { notFound, unauthorized } from '../common/http/errors';
import { logger } from '../common/logger';
import { PrismaService } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { RateLimitService } from '../security/rate-limit.service';
import { SessionsService } from '../staff/sessions.service';

/**
 * Scheduled housekeeping, called by Vercel Cron with `Authorization: Bearer
 * $CRON_SECRET`. Retries email that could not be sent at the time, and clears
 * out rate-limit windows, sessions and links that can no longer be used.
 */
@Controller('internal')
export class MaintenanceController {
  constructor(
    private readonly outbox: OutboxService,
    private readonly limiter: RateLimitService,
    private readonly sessions: SessionsService,
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  @Get('maintenance')
  @HttpCode(200)
  async run(@Headers('authorization') authorization: string | undefined) {
    const secret = this.config.cronSecret;
    if (!secret) {
      throw notFound();
    }
    if (!authorization || !safeEqual(authorization, `Bearer ${secret}`)) {
      throw unauthorized('Not authorised.');
    }

    const started = Date.now();
    let emailed = { sent: 0, failed: 0, expired: 0 };
    for (let round = 0; round < 8; round += 1) {
      const batch = await this.outbox.deliver(undefined, 25);
      emailed = { sent: emailed.sent + batch.sent, failed: emailed.failed + batch.failed, expired: emailed.expired + batch.expired };
      if (batch.sent + batch.failed < 25 || Date.now() - started > 40_000) {
        break;
      }
    }
    const [rateWindows, sessions, links] = await Promise.all([
      this.limiter.purgeExpired(),
      this.sessions.purgeDead(),
      this.prisma.staffToken
        .deleteMany({ where: { OR: [{ usedAt: { lt: new Date(Date.now() - 30 * 86_400_000) } }, { expiresAt: { lt: new Date(Date.now() - 30 * 86_400_000) } }] } })
        .then((result) => result.count),
    ]);
    const summary = { emailed, purged: { rateWindows, sessions, links }, ms: Date.now() - started };
    logger.info({ msg: 'Maintenance finished', ...summary });
    return summary;
  }
}
