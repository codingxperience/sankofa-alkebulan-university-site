import { HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService } from '../audit/audit.service';
import { generateToken, hashToken, hmac } from '../common/crypto/tokens';
import { randomCode, withUniqueReference } from '../common/crypto/references';
import { ApiError, conflict, unauthorized } from '../common/http/errors';
import { appendCookie, readCookie } from '../common/http/client';
import { logger } from '../common/logger';
import { currentRequestContext } from '../common/request-context';
import type { Application, ApplicationPathway, Prisma } from '../generated/prisma/client';
import { PrismaService, isUniqueViolation } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { applicationResumeLink, applicationStaffAlert, applicationSubmitted } from '../notifications/templates';
import { OfficeRoutesService } from '../settings/office-routes.service';
import {
  type Answers,
  DRAFT,
  FUNDING_SOURCES,
  GENDERS,
  PATHWAY_LABELS,
  PATHWAYS,
  STEPS,
  STUDY_MODES,
  type Step,
  signatureMatches,
  stepIssues,
} from './application.schema';
import { upcomingIntakes } from './intakes';

const COOKIE_LIFETIME_DAYS = 180;

export interface ApplicationView {
  reference: string;
  status: Application['status'];
  pathway: ApplicationPathway;
  intake: string;
  answers: Answers;
  completedSteps: string[];
  issues: Partial<Record<Step, Record<string, string>>>;
  version: number;
  updatedAt: Date;
  submittedAt: Date | null;
}

@Injectable()
export class AdmissionsService {
  private readonly cookieName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly offices: OfficeRoutesService,
    @InjectConfig() private readonly config: AppConfig,
  ) {
    this.cookieName = `${config.cookies.prefix}sau_applicant`;
  }

  options() {
    return {
      emailDelivery: this.outbox.deliveryConfigured,
      pathways: PATHWAYS.map((value) => ({ value, label: PATHWAY_LABELS[value] })),
      intakes: upcomingIntakes(),
      studyModes: STUDY_MODES,
      genders: GENDERS,
      fundingSources: FUNDING_SOURCES,
      statementWords: { min: 150, max: 500 },
    };
  }

  // ─── Starting and finding an application ───────────────────────────────

  async start(
    input: { pathway: ApplicationPathway; intake?: string; clientRequestId?: string; website?: string },
    res: Response,
  ): Promise<ApplicationView> {
    if (input.website) {
      logger.info({ msg: 'Application honeypot triggered' });
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Please try again.');
    }
    if (input.clientRequestId) {
      const existing = await this.prisma.application.findUnique({ where: { clientRequestId: input.clientRequestId } });
      if (existing) {
        // A retried start: hand back the same draft with a fresh device key.
        return this.view(await this.rotateToken(existing, res));
      }
    }

    const intake = input.intake && upcomingIntakes().includes(input.intake) ? input.intake : upcomingIntakes()[0];
    const token = generateToken();
    const ip = currentRequestContext()?.ip ?? 'unknown';
    const year = String(new Date().getUTCFullYear()).slice(2);

    const application = await withUniqueReference(
      (ref) =>
        this.prisma.application.create({
          data: {
            reference: ref,
            pathway: input.pathway,
            intake,
            answers: { pathway: { pathway: input.pathway, intake } },
            completedSteps: [],
            resumeTokenHash: hashToken(token),
            clientRequestId: input.clientRequestId,
            submitterHash: hmac(this.config.secret, 'submitter', ip).slice(0, 32),
          },
        }),
      () => `SAU-${year}-${randomCode(6)}`,
      (error) => isUniqueViolation(error, 'reference'),
    );
    this.writeCookie(res, token);
    return this.view(application);
  }

  /** Exchanges a private link's token for this device's cookie. */
  async resume(token: string, res: Response): Promise<ApplicationView> {
    const application = token.length <= 100 ? await this.prisma.application.findUnique({ where: { resumeTokenHash: hashToken(token) } }) : null;
    if (!application) {
      throw new ApiError(
        HttpStatus.GONE,
        'link_invalid',
        'This link no longer opens an application. It may have been replaced by a newer one — request a fresh link below.',
      );
    }
    this.writeCookie(res, token);
    return this.view(application);
  }

  /** The application this device is working on, or null when it has never started one. */
  async current(req: Request): Promise<ApplicationView | null> {
    if (!readCookie(req, this.cookieName)) {
      return null;
    }
    return this.view(await this.fromCookie(req));
  }

  forget(res: Response): void {
    appendCookie(res, this.cookieName, '', this.cookieOptions(0));
  }

  // ─── Autosave ─────────────────────────────────────────────────────────

  async save(req: Request, res: Response, input: { version: number; step: Step; data: unknown }): Promise<ApplicationView & { linkEmailed?: boolean }> {
    const application = await this.fromCookie(req);
    if (application.status !== 'DRAFT') {
      throw conflict('This application has already been submitted, so it can no longer be changed.', 'already_submitted');
    }

    const parsed = DRAFT[input.step].safeParse(input.data ?? {});
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || '_'] ??= issue.message;
      }
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_input', 'Some answers could not be saved.', fields);
    }
    const stepData = parsed.data as Record<string, unknown>;

    const answers: Answers = { ...(application.answers as Answers), [input.step]: stepData };
    const completedSteps = STEPS.filter((step) => Object.keys(stepIssues(step, answers[step])).length === 0);
    const personal = (answers.personal ?? {}) as Record<string, unknown>;
    const pathwayStep = (answers.pathway ?? {}) as Record<string, unknown>;
    const academic = (answers.academic ?? {}) as Record<string, unknown>;
    const email = typeof personal.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email) ? personal.email.toLowerCase() : null;

    const data: Prisma.ApplicationUpdateManyMutationInput = {
      answers: answers as Prisma.InputJsonValue,
      completedSteps,
      version: { increment: 1 },
      pathway: (PATHWAYS as readonly string[]).includes(String(pathwayStep.pathway)) ? (pathwayStep.pathway as ApplicationPathway) : application.pathway,
      intake: typeof pathwayStep.intake === 'string' && pathwayStep.intake ? pathwayStep.intake : application.intake,
      email,
      givenName: typeof personal.givenName === 'string' ? personal.givenName : null,
      familyName: typeof personal.familyName === 'string' ? personal.familyName : null,
      residence: typeof personal.residence === 'string' ? personal.residence : null,
      firstChoice: typeof academic.firstChoice === 'string' ? academic.firstChoice : null,
    };

    // The first time we learn a working email, send the applicant a private
    // link so they can carry on from any device.
    const emailNewlyKnown = Boolean(email && email !== application.email);
    let newToken: string | undefined;
    if (emailNewlyKnown && this.outbox.deliveryConfigured) {
      newToken = generateToken();
      data.resumeTokenHash = hashToken(newToken);
    }

    const result = await this.prisma.application.updateMany({
      where: { id: application.id, version: input.version, status: 'DRAFT' },
      data,
    });
    if (result.count === 0) {
      const latest = await this.prisma.application.findUniqueOrThrow({ where: { id: application.id } });
      throw new ApiError(
        HttpStatus.CONFLICT,
        'stale_version',
        'Your application was changed in another tab or device. The latest version has been loaded.',
        undefined,
        undefined,
        this.view(latest),
      );
    }

    const saved = await this.prisma.application.findUniqueOrThrow({ where: { id: application.id } });
    if (newToken && email) {
      this.writeCookie(res, newToken);
      const emailId = await this.outbox.enqueue({
        template: 'application.resume_link',
        to: email,
        toName: [saved.givenName, saved.familyName].filter(Boolean).join(' ') || null,
        parts: applicationResumeLink({
          givenName: saved.givenName,
          reference: saved.reference,
          pathwayLabel: PATHWAY_LABELS[saved.pathway],
          resumeUrl: this.resumeUrl(newToken),
        }),
        related: { type: 'application', id: saved.id },
      });
      this.outbox.deliverInBackground([emailId]);
      return { ...this.view(saved), linkEmailed: true };
    }
    return this.view(saved);
  }

  /** A fresh private link to copy, for when email is not an option. The previous link stops working. */
  async newLink(req: Request, res: Response): Promise<{ url: string }> {
    const application = await this.fromCookie(req);
    const token = generateToken();
    await this.prisma.application.update({ where: { id: application.id }, data: { resumeTokenHash: hashToken(token) } });
    this.writeCookie(res, token);
    return { url: this.resumeUrl(token) };
  }

  /**
   * Emails fresh links for an address's unfinished applications. The response
   * never says whether any exist, so the form cannot be used to check who has applied.
   */
  async emailLinks(email: string): Promise<void> {
    const drafts = await this.prisma.application.findMany({
      where: { email, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });
    if (drafts.length === 0) {
      return;
    }
    const ids: string[] = [];
    for (const draft of drafts) {
      const token = generateToken();
      await this.prisma.application.update({ where: { id: draft.id }, data: { resumeTokenHash: hashToken(token) } });
      ids.push(
        await this.outbox.enqueue({
          template: 'application.resume_link',
          to: email,
          toName: [draft.givenName, draft.familyName].filter(Boolean).join(' ') || null,
          parts: applicationResumeLink({
            givenName: draft.givenName,
            reference: draft.reference,
            pathwayLabel: PATHWAY_LABELS[draft.pathway],
            resumeUrl: this.resumeUrl(token),
          }),
          related: { type: 'application', id: draft.id },
        }),
      );
    }
    this.outbox.deliverInBackground(ids);
  }

  // ─── Submission ───────────────────────────────────────────────────────

  async submit(req: Request): Promise<ApplicationView> {
    const application = await this.fromCookie(req);
    if (application.status !== 'DRAFT') {
      return this.view(application);
    }
    const answers = application.answers as Answers;
    const issues: Record<string, string> = {};
    for (const step of STEPS) {
      for (const [field, message] of Object.entries(stepIssues(step, answers[step]))) {
        issues[`${step}.${field}`] = message;
      }
    }
    const personal = (answers.personal ?? {}) as Record<string, unknown>;
    const declaration = (answers.declaration ?? {}) as Record<string, unknown>;
    if (!issues['declaration.signature'] && !signatureMatches(String(declaration.signature ?? ''), personal.givenName, personal.familyName)) {
      issues['declaration.signature'] = 'Sign with the same given and family name you entered in your personal details.';
    }
    const intake = String(((answers.pathway ?? {}) as Record<string, unknown>).intake ?? '');
    if (!issues['pathway.intake'] && !upcomingIntakes().includes(intake)) {
      issues['pathway.intake'] = 'That intake is no longer open. Choose one of the upcoming intakes.';
    }
    if (Object.keys(issues).length > 0) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'application_incomplete', 'A few answers still need attention before you can submit.', issues);
    }

    const route = await this.offices.get('ADMISSIONS');
    const name = `${personal.givenName} ${personal.familyName}`;
    const { submitted, emailIds } = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.application.updateMany({
        where: { id: application.id, status: 'DRAFT' },
        data: { status: 'SUBMITTED', submittedAt: new Date(), version: { increment: 1 } },
      });
      const fresh = await tx.application.findUniqueOrThrow({ where: { id: application.id } });
      if (claimed.count === 0) {
        return { submitted: fresh, emailIds: [] as string[] };
      }
      const ids = [
        await this.outbox.enqueue(
          {
            template: 'application.submitted',
            to: fresh.email!,
            toName: name,
            parts: applicationSubmitted({
              givenName: String(personal.givenName),
              reference: fresh.reference,
              pathwayLabel: PATHWAY_LABELS[fresh.pathway],
              intake: fresh.intake,
              firstChoice: fresh.firstChoice,
            }),
            related: { type: 'application', id: fresh.id },
          },
          tx,
        ),
      ];
      for (const to of route.notifyEmails) {
        ids.push(
          await this.outbox.enqueue(
            {
              template: 'application.staff_alert',
              to,
              replyTo: fresh.email,
              parts: applicationStaffAlert({
                reference: fresh.reference,
                name,
                email: fresh.email!,
                pathwayLabel: PATHWAY_LABELS[fresh.pathway],
                intake: fresh.intake,
                firstChoice: fresh.firstChoice,
                residence: fresh.residence,
                adminUrl: `${this.config.siteUrl}/admin/admissions/${fresh.id}`,
              }),
              related: { type: 'application', id: fresh.id },
            },
            tx,
          ),
        );
      }
      await this.audit.record(
        {
          actor: { id: null, label: name },
          action: 'application.submitted',
          entityType: 'application',
          entityId: fresh.id,
          summary: `${name} submitted a ${PATHWAY_LABELS[fresh.pathway].toLowerCase()} application for ${fresh.intake}.`,
        },
        tx,
      );
      return { submitted: fresh, emailIds: ids };
    });
    this.outbox.deliverInBackground(emailIds);
    return this.view(submitted);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private async fromCookie(req: Request): Promise<Application> {
    const token = readCookie(req, this.cookieName);
    if (!token || token.length > 100) {
      throw unauthorized('No application is open on this device. Start one, or use your private link to continue.', 'no_application');
    }
    const application = await this.prisma.application.findUnique({ where: { resumeTokenHash: hashToken(token) } });
    if (!application) {
      throw unauthorized('This device’s link to your application has expired. Use the newest private link we sent you.', 'no_application');
    }
    return application;
  }

  private async rotateToken(application: Application, res: Response): Promise<Application> {
    const token = generateToken();
    const updated = await this.prisma.application.update({
      where: { id: application.id },
      data: { resumeTokenHash: hashToken(token) },
    });
    this.writeCookie(res, token);
    return updated;
  }

  private view(application: Application): ApplicationView {
    const answers = (application.answers ?? {}) as Answers;
    const issues: ApplicationView['issues'] = {};
    for (const step of STEPS) {
      const stepProblems = stepIssues(step, answers[step]);
      if (Object.keys(stepProblems).length > 0) {
        issues[step] = stepProblems;
      }
    }
    return {
      reference: application.reference,
      status: application.status,
      pathway: application.pathway,
      intake: application.intake,
      answers,
      completedSteps: application.completedSteps,
      issues,
      version: application.version,
      updatedAt: application.updatedAt,
      submittedAt: application.submittedAt,
    };
  }

  private resumeUrl(token: string): string {
    return `${this.config.siteUrl}/admissions#resume=${token}`;
  }

  private cookieOptions(maxAgeSeconds: number) {
    return {
      httpOnly: true,
      secure: this.config.cookies.secure,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: maxAgeSeconds,
    };
  }

  private writeCookie(res: Response, token: string): void {
    appendCookie(res, this.cookieName, token, this.cookieOptions(COOKIE_LIFETIME_DAYS * 86_400));
  }
}

