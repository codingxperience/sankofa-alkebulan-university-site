import { HttpStatus, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { AuditService, PUBLIC_ACTOR, SYSTEM_ACTOR } from '../audit/audit.service';
import { decoyPasswordHash, hashPassword, needsRehash, verifyPassword } from '../common/crypto/password';
import { generateToken, hashToken, safeEqual } from '../common/crypto/tokens';
import { ApiError, gone, notFound, unauthorized } from '../common/http/errors';
import type { StaffMember, StaffTokenPurpose } from '../generated/prisma/client';
import { PrismaService, table } from '../database/prisma.service';
import { OutboxService } from '../notifications/outbox.service';
import { staffPasswordReset } from '../notifications/templates';
import { assertStrongPassword } from './password-policy';
import { SessionsService, type StaffPrincipal } from './sessions.service';

const LOCK_AFTER_FAILURES = 5;
const BASE_LOCK_MINUTES = 15;
const MAX_LOCK_MINUTES = 24 * 60;
const RESET_TOKEN_MINUTES = 60;

const INVALID_CREDENTIALS = 'That email and password do not match an active account.';

export interface IssuedLink {
  readonly url: string;
  readonly expiresAt: Date;
}

@Injectable()
export class StaffAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  /** Whether the sign-in screen should offer first-time setup. */
  async setupAvailable(): Promise<boolean> {
    if (!this.config.adminSetupKey) {
      return false;
    }
    return (await this.prisma.staffMember.count()) === 0;
  }

  /** Creates the very first owner account. Disabled for good once any staff account exists. */
  async setup(
    input: { setupKey: string; name: string; email: string; password: string },
    req: Request,
    res: Response,
  ): Promise<void> {
    const key = this.config.adminSetupKey;
    if (!key) {
      throw notFound();
    }
    if (!safeEqual(input.setupKey, key)) {
      throw unauthorized('That setup key is not correct.', 'invalid_setup_key');
    }
    assertStrongPassword(input.password, input);

    const passwordHash = await hashPassword(input.password);
    const owner = await this.prisma.$transaction(async (tx) => {
      // Serialises concurrent setup attempts: only one can see an empty table.
      await tx.$executeRaw`LOCK TABLE ${table('staff_members')} IN SHARE ROW EXCLUSIVE MODE`;
      if ((await tx.staffMember.count()) > 0) {
        throw gone('Setup has already been completed. Sign in instead.', 'setup_complete');
      }
      const created = await tx.staffMember.create({
        data: {
          email: input.email,
          name: input.name,
          roles: ['OWNER'],
          offices: [],
          status: 'ACTIVE',
          passwordHash,
          passwordChangedAt: new Date(),
          lastSignInAt: new Date(),
        },
      });
      await this.audit.record(
        {
          actor: { id: created.id, label: created.name },
          action: 'staff.owner_created',
          entityType: 'staff',
          entityId: created.id,
          summary: `${created.name} set up the admin console as its first owner.`,
        },
        tx,
      );
      return created;
    });
    await this.sessions.start(owner.id, req, res);
  }

  async signIn(email: string, password: string, req: Request, res: Response): Promise<void> {
    const staff = await this.prisma.staffMember.findUnique({ where: { email } });

    if (!staff || !staff.passwordHash) {
      // Pay the same hashing cost as a real check so timing reveals nothing.
      await verifyPassword(password, await decoyPasswordHash());
      throw unauthorized(INVALID_CREDENTIALS, 'invalid_credentials');
    }

    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      throw this.lockedError(staff.lockedUntil);
    }

    const valid = await verifyPassword(password, staff.passwordHash);
    if (!valid) {
      await this.recordFailure(staff);
      throw unauthorized(INVALID_CREDENTIALS, 'invalid_credentials');
    }

    if (staff.status === 'SUSPENDED') {
      throw new ApiError(HttpStatus.FORBIDDEN, 'account_suspended', 'This account has been suspended. Contact an administrator.');
    }
    if (staff.status !== 'ACTIVE') {
      throw unauthorized(INVALID_CREDENTIALS, 'invalid_credentials');
    }

    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: {
        failedSignIns: 0,
        lockedUntil: null,
        lastSignInAt: new Date(),
        // Quietly upgrade hashes made with older, cheaper parameters.
        ...(needsRehash(staff.passwordHash) ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
    await this.sessions.start(staff.id, req, res);
    await this.audit.record({
      actor: { id: staff.id, label: staff.name },
      action: 'staff.signed_in',
      entityType: 'staff',
      entityId: staff.id,
      summary: `${staff.name} signed in.`,
    });
  }

  async signOut(staff: StaffPrincipal, res: Response): Promise<void> {
    await this.sessions.end(staff.sessionId, res);
    await this.audit.record({
      actor: { id: staff.id, label: staff.name },
      action: 'staff.signed_out',
      entityType: 'staff',
      entityId: staff.id,
      summary: `${staff.name} signed out.`,
    });
  }

  async changePassword(
    staff: StaffPrincipal,
    currentPassword: string,
    newPassword: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const record = await this.prisma.staffMember.findUniqueOrThrow({ where: { id: staff.id } });
    if (!record.passwordHash || !(await verifyPassword(currentPassword, record.passwordHash))) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'invalid_current_password', 'Your current password is not correct.', {
        currentPassword: 'Your current password is not correct.',
      });
    }
    if (currentPassword === newPassword) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'password_unchanged', 'Choose a password different from your current one.', {
        newPassword: 'Choose a password different from your current one.',
      });
    }
    assertStrongPassword(newPassword, record);

    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: { passwordHash: await hashPassword(newPassword), passwordChangedAt: new Date() },
    });
    // Every other device is signed out; this one gets a fresh session.
    await this.sessions.revokeAll(staff.id);
    await this.sessions.start(staff.id, req, res);
    await this.audit.record({
      actor: { id: staff.id, label: staff.name },
      action: 'staff.password_changed',
      entityType: 'staff',
      entityId: staff.id,
      summary: `${staff.name} changed their password and was signed out everywhere else.`,
    });
  }

  // ─── One-time links: invitations and password resets ──────────────────

  /** Issues a single-use link. Earlier unused links of the same kind stop working. */
  async issueLink(
    staffId: string,
    purpose: StaffTokenPurpose,
    validForMinutes: number,
    issuedById: string | null,
  ): Promise<IssuedLink> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + validForMinutes * 60_000);
    await this.prisma.$transaction([
      this.prisma.staffToken.updateMany({
        where: { staffId, purpose, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.staffToken.create({
        data: { staffId, purpose, tokenHash: hashToken(token), expiresAt, issuedById },
      }),
    ]);
    const path = purpose === 'INVITATION' ? 'welcome' : 'reset-password';
    // The token travels in the fragment, which browsers never send to a server
    // and so never appears in access logs or Referer headers.
    return { url: `${this.config.siteUrl}/admin/${path}#token=${token}`, expiresAt };
  }

  /** Who a link belongs to, so the page can greet them before they choose a password. */
  async inspectLink(token: string, purpose: StaffTokenPurpose): Promise<{ name: string; email: string }> {
    const record = await this.findUsableToken(token, purpose);
    return { name: record.staff.name, email: record.staff.email };
  }

  async redeemLink(
    token: string,
    purpose: StaffTokenPurpose,
    password: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const record = await this.findUsableToken(token, purpose);
    const { staff } = record;
    if (staff.status === 'SUSPENDED') {
      throw new ApiError(HttpStatus.FORBIDDEN, 'account_suspended', 'This account has been suspended. Contact an administrator.');
    }
    assertStrongPassword(password, staff);
    const passwordHash = await hashPassword(password);

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.staffToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw gone('This link has already been used.', 'link_used');
      }
      await tx.staffMember.update({
        where: { id: staff.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          status: 'ACTIVE',
          failedSignIns: 0,
          lockedUntil: null,
          lastSignInAt: new Date(),
        },
      });
      await this.audit.record(
        {
          actor: { id: staff.id, label: staff.name },
          action: purpose === 'INVITATION' ? 'staff.invitation_accepted' : 'staff.password_reset',
          entityType: 'staff',
          entityId: staff.id,
          summary:
            purpose === 'INVITATION'
              ? `${staff.name} accepted their invitation and joined the console.`
              : `${staff.name} reset their password with an emailed link.`,
        },
        tx,
      );
    });

    await this.sessions.revokeAll(staff.id);
    await this.sessions.start(staff.id, req, res);
  }

  /**
   * Emails a reset link when the address belongs to an active account. The
   * response is identical either way, so the form cannot be used to discover
   * who works at the university.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const staff = await this.prisma.staffMember.findUnique({ where: { email } });
    if (!staff || staff.status !== 'ACTIVE') {
      return;
    }
    const link = await this.issueLink(staff.id, 'PASSWORD_RESET', RESET_TOKEN_MINUTES, null);
    const emailId = await this.outbox.enqueue({
      template: 'staff.password_reset',
      to: staff.email,
      toName: staff.name,
      parts: staffPasswordReset({ name: staff.name, url: link.url, expiresAt: link.expiresAt }),
      related: { type: 'staff', id: staff.id },
    });
    await this.audit.record({
      actor: PUBLIC_ACTOR,
      action: 'staff.password_reset_requested',
      entityType: 'staff',
      entityId: staff.id,
      summary: `A password reset link was requested for ${staff.name}.`,
    });
    this.outbox.deliverInBackground([emailId]);
  }

  private async findUsableToken(token: string, purpose: StaffTokenPurpose) {
    if (!token || token.length > 100) {
      throw gone('This link is not valid. Ask an administrator for a new one.', 'link_invalid');
    }
    const record = await this.prisma.staffToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { staff: true },
    });
    if (!record || record.purpose !== purpose) {
      throw gone('This link is not valid. Ask an administrator for a new one.', 'link_invalid');
    }
    if (record.usedAt) {
      throw gone('This link has already been used.', 'link_used');
    }
    if (record.expiresAt <= new Date()) {
      throw gone('This link has expired. Ask an administrator for a new one.', 'link_expired');
    }
    return record;
  }

  private async recordFailure(staff: StaffMember): Promise<void> {
    const failures = staff.failedSignIns + 1;
    let lockedUntil: Date | null = null;
    if (failures % LOCK_AFTER_FAILURES === 0) {
      // 15 minutes, then 30, 60 … capped at a day: slows guessing to a crawl
      // without locking a forgetful colleague out for long.
      const round = failures / LOCK_AFTER_FAILURES;
      const minutes = Math.min(BASE_LOCK_MINUTES * 2 ** (round - 1), MAX_LOCK_MINUTES);
      lockedUntil = new Date(Date.now() + minutes * 60_000);
    }
    await this.prisma.staffMember.update({
      where: { id: staff.id },
      data: { failedSignIns: failures, ...(lockedUntil ? { lockedUntil } : {}) },
    });
    if (lockedUntil) {
      await this.audit.record({
        actor: SYSTEM_ACTOR,
        action: 'staff.locked_out',
        entityType: 'staff',
        entityId: staff.id,
        summary: `${staff.name}'s account was locked after ${failures} failed sign-in attempts.`,
        metadata: { failures, lockedUntil: lockedUntil.toISOString() },
      });
    }
  }

  private lockedError(until: Date): ApiError {
    const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
    return new ApiError(
      HttpStatus.TOO_MANY_REQUESTS,
      'account_locked',
      `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or reset your password.`,
      undefined,
      { 'Retry-After': String(minutes * 60) },
    );
  }
}

