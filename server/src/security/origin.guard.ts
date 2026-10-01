import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { forbidden } from '../common/http/errors';

const SKIP_ORIGIN_CHECK = Symbol('skip-origin-check');

/** For server-to-server endpoints (payment webhooks, scheduled jobs) that browsers never call. */
export const SkipOriginCheck = () => SetMetadata(SKIP_ORIGIN_CHECK, true);

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cross-site request forgery protection for every state-changing request.
 *
 * Browsers label each request with where it came from (`Sec-Fetch-Site`, and
 * `Origin` on cross-origin requests); scripts on other sites cannot forge
 * either. A write is accepted only when it comes from this site itself.
 * Requests without either header are not from a browser, so they cannot be
 * riding on anyone's cookies, and are left to authentication as usual.
 *
 * Session cookies are also `SameSite=Strict`; this guard is the second lock.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly trustedOrigins: Set<string>;

  constructor(
    private readonly reflector: Reflector,
    @InjectConfig() config: AppConfig,
  ) {
    this.trustedOrigins = new Set([new URL(config.siteUrl).origin]);
    if (!config.isProduction) {
      this.trustedOrigins.add('http://localhost:4200');
      this.trustedOrigins.add('http://127.0.0.1:4200');
    }
    if (process.env.VERCEL_URL) {
      this.trustedOrigins.add(`https://${process.env.VERCEL_URL}`);
    }
    if (process.env.VERCEL_BRANCH_URL) {
      this.trustedOrigins.add(`https://${process.env.VERCEL_BRANCH_URL}`);
    }
  }

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) {
      return true;
    }
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_ORIGIN_CHECK, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const fetchSite = req.headers['sec-fetch-site'];
    if (typeof fetchSite === 'string') {
      if (fetchSite === 'same-origin' || fetchSite === 'none') {
        return true;
      }
      throw forbidden('This request did not come from the Sankofa site.', 'cross_site_request');
    }

    const origin = req.headers.origin;
    if (typeof origin === 'string') {
      if (this.trustedOrigins.has(origin)) {
        return true;
      }
      throw forbidden('This request did not come from the Sankofa site.', 'cross_site_request');
    }

    return true;
  }
}
