import { Body, Controller, Delete, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { sendCsv, toCsv } from '../common/http/csv';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { email, honeypot, optionalLine } from '../common/validation/fields';
import { RateLimit } from '../security/rate-limit.guard';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { NEWSLETTER_CONSENT, SubscribersService } from './subscribers.service';

const SubscribeBody = z.object({
  email,
  name: optionalLine('Name', 120),
  website: honeypot,
});

/** The journal's "Stay informed" sign-up. */
@Controller('audience')
export class PublicAudienceController {
  constructor(private readonly subscribers: SubscribersService) {}

  /** The sentence shown beside the sign-up box — the same one stored with each consent. */
  @Get('newsletter')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  newsletter() {
    return { consentText: NEWSLETTER_CONSENT };
  }

  @Post('subscribe')
  @HttpCode(201)
  @RateLimit(
    { bucket: 'subscribe.minute', limit: 3, windowSeconds: 60 },
    { bucket: 'subscribe.hour', limit: 10, windowSeconds: 3600 },
  )
  async subscribe(@Body(validate(SubscribeBody)) body: z.infer<typeof SubscribeBody>) {
    if (!body.website) {
      await this.subscribers.recordConsent({ email: body.email, name: body.name, source: 'NEWSLETTER', consentText: NEWSLETTER_CONSENT });
    }
    // The same answer whether the address was new, known, or a bot's — nothing to learn from it.
    return { ok: true };
  }
}

const ListQuery = z.object({
  status: z.enum(['subscribed', 'unsubscribed']).optional(),
  q: z.string().trim().max(120).optional(),
  ...pageQuery,
});

@Controller('admin/audience')
export class AudienceController {
  constructor(private readonly subscribers: SubscribersService) {}

  @Get()
  @StaffOnly('audience.read')
  list(@Query(validate(ListQuery)) query: z.infer<typeof ListQuery>) {
    return this.subscribers.list(query);
  }

  @Get('counts')
  @StaffOnly('audience.read')
  counts() {
    return this.subscribers.counts();
  }

  @Get('export')
  @StaffOnly('audience.export')
  async export(@CurrentStaff() staff: StaffPrincipal, @Res() res: Response) {
    const { headers, rows } = await this.subscribers.exportRows(staff);
    sendCsv(res, `sankofa-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  }

  @Post(':id/unsubscribe')
  @StaffOnly('audience.export')
  unsubscribe(@CurrentStaff() staff: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.subscribers.unsubscribe(staff, id);
  }

  @Delete(':id')
  @StaffOnly('audience.export')
  erase(@CurrentStaff() staff: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.subscribers.erase(staff, id);
  }
}
