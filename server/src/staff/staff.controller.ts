import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { validate } from '../common/http/zod.pipe';
import { email, line, optionalLine } from '../common/validation/fields';
import { Office, StaffRole } from '../generated/prisma/client';
import type { StaffPrincipal } from './sessions.service';
import { CurrentStaff, StaffOnly } from './staff.guard';
import { StaffService } from './staff.service';
import { staffTitle } from './staff.schemas';

const roles = z
  .array(z.enum(StaffRole))
  .min(1, 'Choose at least one role.')
  .transform((list) => [...new Set(list)]);
const offices = z.array(z.enum(Office)).transform((list) => [...new Set(list)]);

const InviteBody = z.object({
  email,
  name: line('Name', 120, 2),
  title: optionalLine('Title', 120),
  roles,
  offices: offices.default([]),
});

const UpdateBody = z
  .object({
    name: line('Name', 120, 2).optional(),
    title: staffTitle,
    roles: roles.optional(),
    offices: offices.optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), 'Nothing to change.');

@Controller('admin/staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @StaffOnly('staff.read')
  list() {
    return this.staff.list();
  }

  /** Names for assignment menus — available to anyone who can assign work. */
  @Get('directory')
  @StaffOnly()
  directory() {
    return this.staff.directory();
  }

  @Post()
  @StaffOnly('staff.manage')
  invite(@CurrentStaff() actor: StaffPrincipal, @Body(validate(InviteBody)) body: z.infer<typeof InviteBody>) {
    return this.staff.invite(actor, body);
  }

  @Patch(':id')
  @StaffOnly('staff.manage')
  update(
    @CurrentStaff() actor: StaffPrincipal,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(validate(UpdateBody)) body: z.infer<typeof UpdateBody>,
  ) {
    return this.staff.update(actor, id, body);
  }

  @Post(':id/access-link')
  @StaffOnly('staff.manage')
  accessLink(@CurrentStaff() actor: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.staff.issueAccessLink(actor, id);
  }
}
