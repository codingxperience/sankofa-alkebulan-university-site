import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { notFound } from '../common/http/errors';
import { validate } from '../common/http/zod.pipe';
import { email, line } from '../common/validation/fields';
import { RateLimit } from '../security/rate-limit.guard';
import { ROLE_LABELS } from './permissions';
import { SessionsService, type StaffPrincipal } from './sessions.service';
import { StaffAuthService } from './staff-auth.service';
import { CurrentStaff, StaffOnly } from './staff.guard';

const password = z.string().min(1, 'Password is required.').max(256, 'That password is too long.');
const token = z.string().min(20).max(100);

const SignInBody = z.object({ email, password });
const SetupBody = z.object({ setupKey: z.string().min(1).max(256), name: line('Name', 120, 2), email, password });
const ChangePasswordBody = z.object({ currentPassword: password, newPassword: password });
const TokenBody = z.object({ token });
const RedeemBody = z.object({ token, password });
const ResetRequestBody = z.object({ email });

export function describeStaff(staff: StaffPrincipal) {
  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    title: staff.title,
    roles: staff.roles,
    roleLabels: staff.roles.map((role) => ROLE_LABELS[role]),
    offices: staff.offices,
    permissions: [...staff.permissions].sort(),
  };
}

@Controller('admin/auth')
export class StaffAuthController {
  constructor(
    private readonly auth: StaffAuthService,
    private readonly sessions: SessionsService,
  ) {}

  /** What the sign-in screen needs to know before anyone is signed in. */
  @Get('state')
  async state() {
    return { setupAvailable: await this.auth.setupAvailable() };
  }

  @Post('setup')
  @HttpCode(201)
  @RateLimit({ bucket: 'staff.setup', limit: 5, windowSeconds: 3600 })
  async setup(
    @Body(validate(SetupBody)) body: z.infer<typeof SetupBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.setup(body, req, res);
    return { ok: true };
  }

  @Post('sign-in')
  @HttpCode(200)
  @RateLimit(
    { bucket: 'staff.sign-in', limit: 10, windowSeconds: 600 },
    { bucket: 'staff.sign-in.day', limit: 60, windowSeconds: 86_400 },
  )
  async signIn(
    @Body(validate(SignInBody)) body: z.infer<typeof SignInBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.signIn(body.email, body.password, req, res);
    return { ok: true };
  }

  @Post('sign-out')
  @HttpCode(200)
  @StaffOnly()
  async signOut(@CurrentStaff() staff: StaffPrincipal, @Res({ passthrough: true }) res: Response) {
    await this.auth.signOut(staff, res);
    return { ok: true };
  }

  @Get('me')
  @StaffOnly()
  me(@CurrentStaff() staff: StaffPrincipal) {
    return describeStaff(staff);
  }

  @Post('password')
  @HttpCode(200)
  @StaffOnly()
  @RateLimit({ bucket: 'staff.password', limit: 10, windowSeconds: 900 })
  async changePassword(
    @CurrentStaff() staff: StaffPrincipal,
    @Body(validate(ChangePasswordBody)) body: z.infer<typeof ChangePasswordBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.changePassword(staff, body.currentPassword, body.newPassword, req, res);
    return { ok: true };
  }

  @Get('sessions')
  @StaffOnly()
  async listSessions(@CurrentStaff() staff: StaffPrincipal) {
    const sessions = await this.sessions.listActive(staff.id);
    return sessions.map((session) => ({ ...session, current: session.id === staff.sessionId }));
  }

  @Delete('sessions/:id')
  @StaffOnly()
  async revokeSession(@CurrentStaff() staff: StaffPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    if (!(await this.sessions.revoke(staff.id, id))) {
      throw notFound('That session has already ended.');
    }
    return { ok: true };
  }

  @Post('invitation/inspect')
  @HttpCode(200)
  @RateLimit({ bucket: 'staff.link', limit: 20, windowSeconds: 600 })
  inspectInvitation(@Body(validate(TokenBody)) body: z.infer<typeof TokenBody>) {
    return this.auth.inspectLink(body.token, 'INVITATION');
  }

  @Post('invitation/accept')
  @HttpCode(200)
  @RateLimit({ bucket: 'staff.link', limit: 20, windowSeconds: 600 })
  async acceptInvitation(
    @Body(validate(RedeemBody)) body: z.infer<typeof RedeemBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.redeemLink(body.token, 'INVITATION', body.password, req, res);
    return { ok: true };
  }

  @Post('password-reset/request')
  @HttpCode(202)
  @RateLimit(
    { bucket: 'staff.reset-request', limit: 5, windowSeconds: 900 },
    { bucket: 'staff.reset-request.day', limit: 20, windowSeconds: 86_400 },
  )
  async requestReset(@Body(validate(ResetRequestBody)) body: z.infer<typeof ResetRequestBody>) {
    await this.auth.requestPasswordReset(body.email);
    return { ok: true };
  }

  @Post('password-reset/inspect')
  @HttpCode(200)
  @RateLimit({ bucket: 'staff.link', limit: 20, windowSeconds: 600 })
  inspectReset(@Body(validate(TokenBody)) body: z.infer<typeof TokenBody>) {
    return this.auth.inspectLink(body.token, 'PASSWORD_RESET');
  }

  @Post('password-reset/complete')
  @HttpCode(200)
  @RateLimit({ bucket: 'staff.link', limit: 20, windowSeconds: 600 })
  async completeReset(
    @Body(validate(RedeemBody)) body: z.infer<typeof RedeemBody>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.redeemLink(body.token, 'PASSWORD_RESET', body.password, req, res);
    return { ok: true };
  }
}
