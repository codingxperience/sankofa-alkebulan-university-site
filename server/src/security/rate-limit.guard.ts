import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { clientIp } from '../common/http/client';
import { tooManyRequests } from '../common/http/errors';
import { RateLimitService, type RateRule } from './rate-limit.service';

const RATE_RULES = Symbol('rate-rules');

/**
 * Limits how often one client may call a route. Several rules can be stacked,
 * typically a short burst limit and a longer sustained one:
 *
 *   @RateLimit({ bucket: 'inquiry', limit: 3, windowSeconds: 60 },
 *              { bucket: 'inquiry-hour', limit: 12, windowSeconds: 3600 })
 */
export const RateLimit = (...rules: RateRule[]) => SetMetadata(RATE_RULES, rules);

/** Applied to every state-changing request that has no rule of its own. */
const DEFAULT_WRITE_RULE: RateRule = { bucket: 'write', limit: 120, windowSeconds: 60 };

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const declared = this.reflector.getAllAndOverride<RateRule[] | undefined>(RATE_RULES, [
      context.getHandler(),
      context.getClass(),
    ]);
    const rules = declared ?? (SAFE_METHODS.has(req.method) ? [] : [DEFAULT_WRITE_RULE]);
    if (rules.length === 0) {
      return true;
    }

    const ip = clientIp(req);
    let tightest: { remaining: number; limit: number; resetAt: Date } | undefined;
    for (const rule of rules) {
      const decision = await this.limiter.hit(rule, ip);
      if (!decision.allowed) {
        throw tooManyRequests((decision.resetAt.getTime() - Date.now()) / 1000);
      }
      if (!tightest || decision.remaining < tightest.remaining) {
        tightest = decision;
      }
    }

    if (tightest) {
      res.setHeader('RateLimit-Limit', String(tightest.limit));
      res.setHeader('RateLimit-Remaining', String(tightest.remaining));
      res.setHeader('RateLimit-Reset', String(Math.max(0, Math.ceil((tightest.resetAt.getTime() - Date.now()) / 1000))));
    }
    return true;
  }
}
