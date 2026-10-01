import { Injectable } from '@nestjs/common';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { hmac } from '../common/crypto/tokens';
import { logger } from '../common/logger';
import { Prisma } from '../generated/prisma/client';
import { PrismaService, table } from '../database/prisma.service';

export interface RateRule {
  /** Name of the thing being limited, e.g. `staff.sign-in`. */
  readonly bucket: string;
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateDecision {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: Date;
}

/**
 * Fixed-window rate limiting stored in Postgres, so every serverless instance
 * shares the same counters. One atomic upsert per check: no read-then-write
 * race, no lock held across a network round trip.
 *
 * Identities (IP addresses, email addresses) are keyed with an HMAC of the app
 * secret, so the table never holds anything that identifies a person.
 */
@Injectable()
export class RateLimitService {
  /** Keys this instance already knows are over their limit, and until when. */
  private readonly blocked = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async hit(rule: RateRule, identity: string): Promise<RateDecision> {
    const key = hmac(this.config.secret, 'rate', rule.bucket, identity);
    const now = Date.now();

    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && blockedUntil > now) {
      return { allowed: false, limit: rule.limit, remaining: 0, resetAt: new Date(blockedUntil) };
    }

    try {
      const [row] = await this.prisma.$queryRaw<Array<{ hits: number; reset_at: Date }>>`
        INSERT INTO ${table('rate_limit_buckets')} ("key", "hits", "reset_at")
        VALUES (${key}, 1, now() + make_interval(secs => ${rule.windowSeconds}::double precision))
        ON CONFLICT ("key") DO UPDATE SET
          "hits" = CASE
            WHEN ${table('rate_limit_buckets')}."reset_at" <= now() THEN 1
            ELSE LEAST(${table('rate_limit_buckets')}."hits" + 1, 1000000)
          END,
          "reset_at" = CASE
            WHEN ${table('rate_limit_buckets')}."reset_at" <= now() THEN EXCLUDED."reset_at"
            ELSE ${table('rate_limit_buckets')}."reset_at"
          END
        RETURNING "hits", "reset_at"
      `;
      const hits = Number(row.hits);
      const resetAt = new Date(row.reset_at);
      const allowed = hits <= rule.limit;
      if (!allowed) {
        this.remember(key, resetAt.getTime());
      }
      return { allowed, limit: rule.limit, remaining: Math.max(0, rule.limit - hits), resetAt };
    } catch (error) {
      // Failing closed would turn a database hiccup into a site-wide outage of
      // every form. The request itself still needs the database, so it will
      // fail on its own if the problem is real.
      logger.warn({ msg: 'Rate limiter unavailable; allowing request', bucket: rule.bucket, err: error });
      return { allowed: true, limit: rule.limit, remaining: rule.limit, resetAt: new Date(now + rule.windowSeconds * 1000) };
    }
  }

  /** Clears the counter for an identity, e.g. after a successful sign-in. */
  async reset(rule: RateRule, identity: string): Promise<void> {
    const key = hmac(this.config.secret, 'rate', rule.bucket, identity);
    this.blocked.delete(key);
    await this.prisma.$executeRaw`DELETE FROM ${table('rate_limit_buckets')} WHERE "key" = ${key}`;
  }

  /** Removes expired windows. Called by the scheduled maintenance job. */
  async purgeExpired(): Promise<number> {
    return this.prisma.$executeRaw(
      Prisma.sql`DELETE FROM ${table('rate_limit_buckets')} WHERE "reset_at" < now() - interval '1 hour'`,
    );
  }

  private remember(key: string, until: number): void {
    if (this.blocked.size > 5_000) {
      const now = Date.now();
      for (const [k, expiry] of this.blocked) {
        if (expiry <= now) {
          this.blocked.delete(k);
        }
      }
      if (this.blocked.size > 5_000) {
        this.blocked.clear();
      }
    }
    this.blocked.set(key, until);
  }
}
