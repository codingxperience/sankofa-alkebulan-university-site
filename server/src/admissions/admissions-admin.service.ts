import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ApiError, notFound } from '../common/http/errors';
import { afterCursor, decodeCursor, toPage } from '../common/http/pagination';
import type { ApplicationPathway, ApplicationStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { StaffPrincipal } from '../staff/sessions.service';
import { actorOf } from '../staff/staff.guard';
import { PATHWAY_LABELS, type Answers } from './application.schema';

/** Statuses an admissions officer may move a submitted application into. */
export const REVIEW_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CONDITIONAL_OFFER',
  'OFFER',
  'WAITLISTED',
  'DECLINED',
  'WITHDRAWN',
] as const satisfies readonly ApplicationStatus[];

const DECISIONS: readonly ApplicationStatus[] = ['CONDITIONAL_OFFER', 'OFFER', 'WAITLISTED', 'DECLINED'];

const STATUS_WORDS: Record<ApplicationStatus, string> = {
  DRAFT: 'in progress',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under review',
  CONDITIONAL_OFFER: 'conditional offer',
  OFFER: 'offer',
  WAITLISTED: 'waitlisted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
};

export interface ApplicationListQuery {
  status?: ApplicationStatus | 'PIPELINE';
  pathway?: ApplicationPathway;
  intake?: string;
  assignee?: string;
  q?: string;
  cursor?: string;
  limit: number;
}

@Injectable()
export class AdmissionsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private where(staff: StaffPrincipal, query: Omit<ApplicationListQuery, 'cursor' | 'limit'>): Prisma.ApplicationWhereInput {
    const where: Prisma.ApplicationWhereInput = {};
    if (!query.status || query.status === 'PIPELINE') {
      where.status = { not: 'DRAFT' };
    } else {
      where.status = query.status;
    }
    if (query.pathway) where.pathway = query.pathway;
    if (query.intake) where.intake = query.intake;
    if (query.assignee === 'me') where.assigneeId = staff.id;
    else if (query.assignee === 'unassigned') where.assigneeId = null;
    else if (query.assignee) where.assigneeId = query.assignee;
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { reference: { equals: q.toUpperCase() } },
        { email: { contains: q.toLowerCase() } },
        { givenName: { contains: q, mode: 'insensitive' } },
        { familyName: { contains: q, mode: 'insensitive' } },
        { firstChoice: { contains: q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async list(staff: StaffPrincipal, query: ApplicationListQuery) {
    const rows = await this.prisma.application.findMany({
      where: { AND: [this.where(staff, query), afterCursor(decodeCursor(query.cursor))] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      include: { assignee: { select: { id: true, name: true } }, _count: { select: { notes: true } } },
    });
    return toPage(rows, query.limit, (row) => ({
      id: row.id,
      reference: row.reference,
      status: row.status,
      pathway: row.pathway,
      intake: row.intake,
      name: [row.givenName, row.familyName].filter(Boolean).join(' ') || null,
      email: row.email,
      residence: row.residence,
      firstChoice: row.firstChoice,
      completedSteps: row.completedSteps.length,
      assignee: row.assignee,
      notes: row._count.notes,
      submittedAt: row.submittedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async stats() {
    const [byStatus, byPathway, intakes] = await Promise.all([
      this.prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.application.groupBy({ by: ['pathway'], where: { status: { not: 'DRAFT' } }, _count: { _all: true } }),
      this.prisma.application.groupBy({ by: ['intake'], where: { status: { not: 'DRAFT' } }, _count: { _all: true }, orderBy: { intake: 'asc' } }),
    ]);
    return {
      status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      pathway: Object.fromEntries(byPathway.map((row) => [row.pathway, row._count._all])),
      intakes: intakes.map((row) => ({ intake: row.intake, count: row._count._all })),
    };
  }

  async detail(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true } },
        notes: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } },
      },
    });
    if (!application) {
      throw notFound('That application no longer exists.');
    }
    const activity = await this.prisma.auditEvent.findMany({
      where: { entityType: 'application', entityId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, actorLabel: true, action: true, summary: true, createdAt: true },
    });
    const { resumeTokenHash: _token, submitterHash: _submitter, clientRequestId: _request, ...visible } = application;
    return { ...visible, answers: application.answers as Answers, activity };
  }

  async update(staff: StaffPrincipal, id: string, input: { status?: (typeof REVIEW_STATUSES)[number]; assigneeId?: string | null }) {
    const current = await this.prisma.application.findUnique({ where: { id } });
    if (!current) {
      throw notFound('That application no longer exists.');
    }
    if (current.status === 'DRAFT') {
      throw new ApiError(HttpStatus.CONFLICT, 'application_draft', 'This application has not been submitted yet, so it cannot be reviewed.');
    }
    if (input.assigneeId) {
      const assignee = await this.prisma.staffMember.findUnique({ where: { id: input.assigneeId } });
      if (!assignee || assignee.status !== 'ACTIVE') {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_assignee', 'That person cannot be assigned work.');
      }
    }

    const data: Prisma.ApplicationUncheckedUpdateInput = {};
    const changes: string[] = [];
    if (input.status && input.status !== current.status) {
      data.status = input.status;
      data.decidedAt = DECISIONS.includes(input.status) ? new Date() : current.decidedAt;
      changes.push(`moved it to ${STATUS_WORDS[input.status]}`);
    }
    if (input.assigneeId !== undefined && input.assigneeId !== current.assigneeId) {
      data.assigneeId = input.assigneeId;
      if (input.assigneeId === null) {
        changes.push('unassigned it');
      } else {
        const assignee = await this.prisma.staffMember.findUniqueOrThrow({ where: { id: input.assigneeId }, select: { name: true } });
        changes.push(input.assigneeId === staff.id ? 'took it for review' : `assigned it to ${assignee.name}`);
      }
    }
    if (changes.length === 0) {
      return this.detail(id);
    }

    const applicant = [current.givenName, current.familyName].filter(Boolean).join(' ') || current.reference;
    await this.prisma.$transaction(async (tx) => {
      await tx.application.update({ where: { id }, data: { ...data, version: { increment: 1 } } });
      await this.audit.record(
        {
          actor: actorOf(staff),
          action: 'application.updated',
          entityType: 'application',
          entityId: id,
          summary: `${staff.name} ${changes.join(', ')} (${applicant}).`,
        },
        tx,
      );
    });
    return this.detail(id);
  }

  async addNote(staff: StaffPrincipal, id: string, body: string) {
    const exists = await this.prisma.application.count({ where: { id } });
    if (!exists) {
      throw notFound('That application no longer exists.');
    }
    await this.prisma.applicationNote.create({ data: { applicationId: id, authorId: staff.id, body } });
    return this.detail(id);
  }

  async exportRows(staff: StaffPrincipal, query: Omit<ApplicationListQuery, 'cursor' | 'limit'>) {
    const rows = await this.prisma.application.findMany({
      where: this.where(staff, query),
      orderBy: { submittedAt: 'asc' },
      take: 10_000,
    });
    const headers = [
      'Reference', 'Status', 'Pathway', 'Intake', 'Study mode', 'Given name', 'Family name', 'Email', 'Phone',
      'Date of birth', 'Citizenship', 'Residence', 'First choice', 'Second choice', 'Funding', 'Scholarship',
      'Submitted at',
    ];
    const data = rows.map((row) => {
      const a = row.answers as Answers;
      const pick = (step: keyof Answers, key: string) => (a[step] as Record<string, unknown> | undefined)?.[key];
      return [
        row.reference, STATUS_WORDS[row.status], PATHWAY_LABELS[row.pathway], row.intake, pick('pathway', 'studyMode'),
        row.givenName, row.familyName, row.email, pick('personal', 'phone'), pick('personal', 'dateOfBirth'),
        pick('personal', 'citizenship'), row.residence, row.firstChoice, pick('academic', 'secondChoice'),
        pick('funding', 'source'), pick('funding', 'scholarshipInterest') === true ? 'Yes' : pick('funding', 'scholarshipInterest') === false ? 'No' : '',
        row.submittedAt,
      ];
    });
    await this.audit.record({
      actor: actorOf(staff),
      action: 'application.exported',
      entityType: 'application',
      summary: `${staff.name} exported ${rows.length} application${rows.length === 1 ? '' : 's'} to CSV.`,
    });
    return { headers, rows: data };
  }
}
