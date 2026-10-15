import { Body, Controller, Get, Header, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { sendCsv, toCsv } from '../common/http/csv';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { clearableLine, clearableParagraph, clientRequestId, email, honeypot, line, optionalLine, optionalParagraph, phone } from '../common/validation/fields';
import { EventStatus, RegistrationStatus } from '../generated/prisma/client';
import { RateLimit } from '../security/rate-limit.guard';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { EventOptionsSchema } from './event-options';
import { EventsService } from './events.service';

const slugParam = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);

const RegisterBody = z.object({
  name: line('Full name', 120, 2),
  email,
  phone,
  place: optionalLine('Country and city', 120),
  organisation: optionalLine('Organisation', 160),
  role: optionalLine('Role', 120),
  attendeeCategory: optionalLine('Attending as', 80),
  attendanceMode: optionalLine('How you will join', 80),
  days: optionalLine('Days', 80),
  interests: z.array(z.string().trim().max(80)).max(20).default([]).transform((list) => [...new Set(list)]),
  question: optionalParagraph('Question', 1500),
  accessNeeds: optionalLine('Access or dietary needs', 300),
  wantsUpdates: z.boolean().default(false),
  clientRequestId,
  website: honeypot,
});

@Controller('events')
export class PublicEventsController {
  constructor(private readonly events: EventsService) {}

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
  event(@Param('slug', validate(slugParam)) slug: string) {
    return this.events.publicEvent(slug);
  }

  @Post(':slug/registrations')
  @HttpCode(201)
  @RateLimit(
    { bucket: 'event.register.minute', limit: 4, windowSeconds: 60 },
    { bucket: 'event.register.hour', limit: 20, windowSeconds: 3600 },
  )
  register(@Param('slug', validate(slugParam)) slug: string, @Body(validate(RegisterBody)) body: z.infer<typeof RegisterBody>) {
    return this.events.register(slug, body);
  }
}

const isoDate = z.coerce.date({ error: 'Use a valid date and time.' });

const EventBody = z.object({
  slug: slugParam,
  title: line('Title', 160, 3),
  summary: clearableParagraph('Summary', 2000),
  venue: clearableLine('Venue', 200),
  timezone: z.string().refine((zone) => Intl.supportedValuesOf('timeZone').includes(zone), 'Choose a valid time zone.').default('Africa/Kampala'),
  startsAt: isoDate,
  endsAt: isoDate.nullable().optional(),
  registrationClosesAt: isoDate.nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(EventStatus).default('DRAFT'),
  options: EventOptionsSchema,
});
const EventPatch = EventBody.partial().refine((body) => Object.keys(body).length > 0, 'Nothing to change.');

const RegistrationsQuery = z.object({
  status: z.enum(RegistrationStatus).optional(),
  q: z.string().trim().max(120).optional(),
  ...pageQuery,
});
const RegistrationPatch = z
  .object({ status: z.enum(RegistrationStatus).optional(), checkedIn: z.boolean().optional() })
  .refine((body) => body.status || body.checkedIn !== undefined, 'Nothing to change.');

@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @StaffOnly('events.read')
  list() {
    return this.events.list();
  }

  @Post()
  @StaffOnly('events.manage')
  create(@CurrentStaff() staff: StaffPrincipal, @Body(validate(EventBody)) body: z.infer<typeof EventBody>) {
    return this.events.create(staff, body);
  }

  @Get(':id')
  @StaffOnly('events.read')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.events.detail(id);
  }

  @Patch(':id')
  @StaffOnly('events.manage')
  update(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(EventPatch)) body: z.infer<typeof EventPatch>,
  ) {
    return this.events.update(staff, id, body);
  }

  @Get(':id/registrations')
  @StaffOnly('events.read')
  registrations(@Param('id', new ParseUUIDPipe()) id: string, @Query(validate(RegistrationsQuery)) query: z.infer<typeof RegistrationsQuery>) {
    return this.events.registrations(id, query);
  }

  @Get(':id/registrations/export')
  @StaffOnly('events.read')
  async export(@CurrentStaff() staff: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string, @Res() res: Response) {
    const { event, headers, rows } = await this.events.exportRows(staff, id);
    sendCsv(res, `${event.slug}-registrations-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  }

  @Patch(':id/registrations/:registrationId')
  @StaffOnly('events.manage')
  updateRegistration(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body(validate(RegistrationPatch)) body: z.infer<typeof RegistrationPatch>,
  ) {
    return this.events.updateRegistration(staff, id, registrationId, body);
  }
}
