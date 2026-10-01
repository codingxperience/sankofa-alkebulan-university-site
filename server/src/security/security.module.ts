import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { OriginGuard } from './origin.guard';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

/**
 * Guards that run before every route, in this order: reject cross-site writes,
 * then count the request against its rate limits. Authentication guards are
 * declared per controller and run after these.
 */
@Global()
@Module({
  providers: [
    RateLimitService,
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [RateLimitService],
})
export class SecurityModule {}
