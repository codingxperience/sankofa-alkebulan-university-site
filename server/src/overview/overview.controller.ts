import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import { validate } from '../common/http/zod.pipe';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { CurrentStaff, StaffOnly } from '../staff/staff.guard';
import { OverviewService } from './overview.service';

const DaybookQuery = z.object({
  kind: z.enum(['inquiry', 'application', 'registration', 'order']).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const AuditQuery = z.object({
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(60).optional(),
  actorId: z.uuid().optional(),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

@Controller('admin')
export class OverviewController {
  constructor(
    private readonly overview: OverviewService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @StaffOnly('overview.read')
  summary(@CurrentStaff() staff: StaffPrincipal) {
    return this.overview.summary(staff);
  }

  @Get('daybook')
  @StaffOnly('overview.read')
  daybook(@CurrentStaff() staff: StaffPrincipal, @Query(validate(DaybookQuery)) query: z.infer<typeof DaybookQuery>) {
    return this.overview.daybook(staff, query.cursor, query.limit, query.kind);
  }

  @Get('audit')
  @StaffOnly('audit.read')
  async audit(@Query(validate(AuditQuery)) query: z.infer<typeof AuditQuery>) {
    const where: Prisma.AuditEventWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.q) where.summary = { contains: query.q, mode: 'insensitive' };
    const rows = await this.prisma.auditEvent.findMany({
      where: { AND: [where, afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    return toPage(rows, query.limit, (row) => row);
  }
}
