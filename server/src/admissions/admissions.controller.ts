import { Body, Controller, Get, Header, HttpCode, Post, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../common/http/zod.pipe';
import { clientRequestId, email, honeypot } from '../common/validation/fields';
import { RateLimit } from '../security/rate-limit.guard';
import { PATHWAYS, STEPS } from './application.schema';
import { AdmissionsService } from './admissions.service';

const StartBody = z.object({
  pathway: z.enum(PATHWAYS, { error: 'Choose a pathway.' }),
  intake: z.string().max(60).optional(),
  clientRequestId,
  website: honeypot,
});
const ResumeBody = z.object({ token: z.string().min(20).max(100) });
const SaveBody = z.object({
  version: z.number().int().min(1),
  step: z.enum(STEPS),
  data: z.record(z.string(), z.unknown()),
});
const LinkRequestBody = z.object({ email });

/**
 * The applicant's side of admissions. No account is needed: an application
 * is tied to the device by an HttpOnly cookie, and to any other device by a
 * private link the applicant can request by email.
 */
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get('options')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
  options() {
    return this.admissions.options();
  }

  @Post('applications')
  @HttpCode(201)
  @RateLimit(
    { bucket: 'application.start', limit: 5, windowSeconds: 600 },
    { bucket: 'application.start.day', limit: 20, windowSeconds: 86_400 },
  )
  start(@Body(validate(StartBody)) body: z.infer<typeof StartBody>, @Res({ passthrough: true }) res: Response) {
    return this.admissions.start(body, res);
  }

  @Post('applications/resume')
  @HttpCode(200)
  @RateLimit({ bucket: 'application.resume', limit: 20, windowSeconds: 600 })
  resume(@Body(validate(ResumeBody)) body: z.infer<typeof ResumeBody>, @Res({ passthrough: true }) res: Response) {
    return this.admissions.resume(body.token, res);
  }

  /** 204 when this device has no application yet — an ordinary first visit, not an error. */
  @Get('applications/current')
  async current(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const application = await this.admissions.current(req);
    if (!application) {
      res.status(204);
      return;
    }
    return application;
  }

  @Put('applications/current')
  @RateLimit({ bucket: 'application.save', limit: 300, windowSeconds: 600 })
  save(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(validate(SaveBody)) body: z.infer<typeof SaveBody>,
  ) {
    return this.admissions.save(req, res, body);
  }

  @Post('applications/current/link')
  @HttpCode(200)
  @RateLimit({ bucket: 'application.link', limit: 10, windowSeconds: 3600 })
  newLink(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.admissions.newLink(req, res);
  }

  @Post('applications/current/submit')
  @HttpCode(200)
  @RateLimit({ bucket: 'application.submit', limit: 10, windowSeconds: 3600 })
  submit(@Req() req: Request) {
    return this.admissions.submit(req);
  }

  /** Removes the application from this device (it stays saved; the private link still opens it). */
  @Post('applications/current/forget')
  @HttpCode(200)
  forget(@Res({ passthrough: true }) res: Response) {
    this.admissions.forget(res);
    return { ok: true };
  }

  @Post('resume-links')
  @HttpCode(202)
  @RateLimit(
    { bucket: 'application.links', limit: 3, windowSeconds: 900 },
    { bucket: 'application.links.day', limit: 10, windowSeconds: 86_400 },
  )
  async emailLinks(@Body(validate(LinkRequestBody)) body: z.infer<typeof LinkRequestBody>) {
    await this.admissions.emailLinks(body.email);
    return { ok: true };
  }
}
