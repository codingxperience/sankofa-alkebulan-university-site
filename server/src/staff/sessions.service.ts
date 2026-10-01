import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { appendCookie, clientIp, readCookie, userAgent } from '../common/http/client';
import { generateToken, hashToken } from '../common/crypto/tokens';
import type { Office, StaffRole } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { permissionsFor, type Permission } from './permissions';

/** A signed-in staff member, as seen by every admin route. */
export interface StaffPrincipal {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly title: string | null;
  readonly roles: readonly StaffRole[];
  readonly offices: readonly Office[];
  readonly permissions: ReadonlySet<Permission>;
  readonly sessionId: string;
}

/** Sessions end 12 hours after sign-in, or after 2 hours without activity. */
const ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
/** Activity is recorded at most this often, so browsing does not write on every request. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Server-side sessions. The browser holds a random token in an HttpOnly,
 * SameSite=Strict cookie that page scripts cannot read; the database holds
 * only its SHA-256 digest. Signing out, suspending an account or changing a
 * password revokes sessions immediately — something a stateless JWT cannot do.
 */
@Injectable()
export class SessionsService {
  private readonly cookieName: string;

  constructor(
    private readonly prisma: PrismaService,
    @InjectConfig() private readonly config: AppConfig,
  ) {
    this.cookieName = `${config.cookies.prefix}sau_staff`;
  }

  async start(staffId: string, req: Request, res: Response): Promise<void> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + ABSOLUTE_LIFETIME_MS);
    await this.prisma.staffSession.create({
      data: {
        staffId,
        tokenHash: hashToken(token),
        ipAddress: clientIp(req),
        userAgent: userAgent(req),
        expiresAt,
      },
    });
    this.writeCookie(res, token, expiresAt);
  }

  /** Resolves the request's session cookie into a principal, or null when absent, expired or revoked. */
  async authenticate(req: Request): Promise<StaffPrincipal | null> {
    const token = readCookie(req, this.cookieName);
    if (!token || token.length > 100) {
      return null;
    }
    const session = await this.prisma.staffSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { staff: true },
    });
    if (!session || session.revokedAt) {
      return null;
    }
    const now = Date.now();
    if (session.expiresAt.getTime() <= now || session.lastSeenAt.getTime() + IDLE_TIMEOUT_MS <= now) {
      return null;
    }
    const { staff } = session;
    if (staff.status !== 'ACTIVE') {
      return null;
    }
    // A password change ends every session that began before it.
    if (staff.passwordChangedAt && staff.passwordChangedAt > session.createdAt) {
      return null;
    }

    if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.staffSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
    }

    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      title: staff.title,
      roles: staff.roles,
      offices: staff.offices,
      permissions: permissionsFor(staff.roles),
      sessionId: session.id,
    };
  }

  async end(sessionId: string, res: Response): Promise<void> {
    await this.prisma.staffSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    this.clearCookie(res);
  }

  async revoke(staffId: string, sessionId: string): Promise<boolean> {
    const result = await this.prisma.staffSession.updateMany({
      where: { id: sessionId, staffId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  async revokeAll(staffId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.staffSession.updateMany({
      where: { staffId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async listActive(staffId: string) {
    const idleCutoff = new Date(Date.now() - IDLE_TIMEOUT_MS);
    return this.prisma.staffSession.findMany({
      where: { staffId, revokedAt: null, expiresAt: { gt: new Date() }, lastSeenAt: { gt: idleCutoff } },
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    });
  }

  /** Deletes sessions that can no longer be used. Called by the maintenance job. */
  async purgeDead(): Promise<number> {
    const result = await this.prisma.staffSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
          { revokedAt: { lt: new Date(Date.now() - 86_400_000) } },
        ],
      },
    });
    return result.count;
  }

  clearCookie(res: Response): void {
    appendCookie(res, this.cookieName, '', {
      httpOnly: true,
      secure: this.config.cookies.secure,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });
  }

  private writeCookie(res: Response, token: string, expiresAt: Date): void {
    appendCookie(res, this.cookieName, token, {
      httpOnly: true,
      secure: this.config.cookies.secure,
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });
  }
}
