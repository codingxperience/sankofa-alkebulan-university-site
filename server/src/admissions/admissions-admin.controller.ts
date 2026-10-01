import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { sendCsv, toCsv } from '../common/http/csv';
import { pageQuery } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import { paragraph } from '../common/validation/fields';
import { ApplicationStatus } from '../generated/prisma/client';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { PATHWAYS } from './application.schema';
import { AdmissionsAdminService, REVIEW_STATUSES } from './admissions-admin.service';

const Filters = {
  status: z.union([z.enum(ApplicationStatus), z.literal('PIPELINE')]).optional(),
  pathway: z.enum(PATHWAYS).optional(),
  intake: z.string().trim().max(60).optional(),
  assignee: z.union([z.literal('me'), z.literal('unassigned'), z.uuid()]).optional(),
  q: z.string().trim().max(120).optional(),
};
const ListQuery = z.object({ ...Filters, ...pageQuery });
const ExportQuery = z.object(Filters);

const UpdateBody = z
  .object({
    status: z.enum(REVIEW_STATUSES).optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .refine((body) => body.status || body.assigneeId !== undefined, 'Nothing to change.');
const NoteBody = z.object({ body: paragraph('Note', 5000) });

@Controller('admin/applications')
export class AdmissionsAdminController {
  constructor(private readonly admissions: AdmissionsAdminService) {}

  @Get()
  @StaffOnly('applications.read')
  list(@CurrentStaff() staff: StaffPrincipal, @Query(validate(ListQuery)) query: z.infer<typeof ListQuery>) {
    return this.admissions.list(staff, query);
  }

  @Get('stats')
  @StaffOnly('applications.read')
  stats() {
    return this.admissions.stats();
  }

  @Get('export')
  @StaffOnly('applications.read')
  async export(
    @CurrentStaff() staff: StaffPrincipal,
    @Query(validate(ExportQuery)) query: z.infer<typeof ExportQuery>,
    @Res() res: Response,
  ) {
    const { headers, rows } = await this.admissions.exportRows(staff, query);
    sendCsv(res, `sankofa-applications-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  }

  @Get(':id')
  @StaffOnly('applications.read')
  detail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admissions.detail(id);
  }

  @Patch(':id')
  @StaffOnly('applications.manage')
  update(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(UpdateBody)) body: z.infer<typeof UpdateBody>,
  ) {
    return this.admissions.update(staff, id, body);
  }

  @Post(':id/notes')
  @StaffOnly('applications.manage')
  addNote(
    @CurrentStaff() staff: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(NoteBody)) body: z.infer<typeof NoteBody>,
  ) {
    return this.admissions.addNote(staff, id, body.body);
  }
}
