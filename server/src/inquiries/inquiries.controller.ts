import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { clientRequestId, email, honeypot, line, optionalLine, paragraph } from '../common/validation/fields';
import { InquirySource, InquiryStatus, Office } from '../generated/prisma/client';
import { RateLimit } from '../security/rate-limit.guard';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { InquiriesService } from './inquiries.service';

const details = z
  .record(z.string().max(60), z.string().max(600))
  .refine((record) => Object.keys(record).length <= 40, 'Too many detail fields.')
  .transform((record) =>
    Object.fromEntries(
      Object.entries(record)
        .map(([key, value]) => [key.trim(), value.replace(/\s+/g, ' ').trim()] as const)
        .filter(([key, value]) => key && value),
    ),
  )
  .optional();

const SubmitBody = z.object({
  office: z.enum(Office, { error: 'Choose who should receive your message.' }),
  source: z.enum(InquirySource).default('CONTACT_PAGE'),
  name: line('Your name', 120, 2),
  email,
  origin: optionalLine('Country or institution', 160),
  subject: optionalLine('Subject', 200),
  message: paragraph('Your message', 5000, 10),
  details,
  clientRequestId,
  website: honeypot,
});

@Controller('inquiries')
export class PublicInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Post()
  @HttpCode(201)
  @RateLimit(
    { bucket: 'inquiry.minute', limit: 4, windowSeconds: 60 },
    { bucket: 'inquiry.hour', limit: 15, windowSeconds: 3600 },
  )
  submit(@Body(validate(SubmitBody)) body: z.infer<typeof SubmitBody>) {
    return this.inquiries.submit(body);
  }
}

const ListQuery = z.object({
  status: z.union([z.enum(InquiryStatus), z.literal('ACTIVE')]).optional(),
  office: z.enum(Office).optional(),
  assignee: z.union([z.literal('me'), z.literal('unassigned'), z.uuid()]).optional(),
  q: z.string().trim().max(120).optional(),
  ...pageQuery,
});

const UpdateBody = z
  .object({
    status: z.enum(InquiryStatus).optional(),
    office: z.enum(Office).optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .refine((body) => body.status || body.office || body.assigneeId !== undefined, 'Nothing to change.');

const NoteBody = z.object({ body: paragraph('Note', 5000) });
const ReplyBody = z.object({ body: paragraph('Reply', 10000, 2) });

@Controller('admin/inquiries')
export class AdminInquiriesController {
  constructor(private readonly inquiries: InquiriesService) {}

  @Get()
  @StaffOnly('inquiries.read')
  list(@CurrentStaff() staff: StaffPrincipal, @Query(validate(ListQuery)) query: z.infer<typeof ListQuery>) {
    return this.inquiries.list(staff, query);
  }

  @Get('counts')
  @StaffOnly('inquiries.read')
  counts() {
    return this.inquiries.counts();
  }

  @Get(':id')
  @StaffOnly('inquiries.read')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inquiries.detail(id);
  }

  @Patch(':id')
  @StaffOnly('inquiries.manage')
  update(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(UpdateBody)) body: z.infer<typeof UpdateBody>,
  ) {
    return this.inquiries.update(staff, id, body);
  }

  @Post(':id/notes')
  @StaffOnly('inquiries.manage')
  addNote(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(NoteBody)) body: z.infer<typeof NoteBody>,
  ) {
    return this.inquiries.addNote(staff, id, body.body);
  }

  @Post(':id/replies')
  @StaffOnly('inquiries.manage')
  @RateLimit({ bucket: 'inquiry.reply', limit: 30, windowSeconds: 600 })
  reply(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(ReplyBody)) body: z.infer<typeof ReplyBody>,
  ) {
    return this.inquiries.reply(staff, id, body.body);
  }
}
