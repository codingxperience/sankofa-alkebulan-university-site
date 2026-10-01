import { Controller, Get, Header, HttpCode, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../database/prisma.service';

/** Liveness and database reachability, for uptime monitors. Reveals no configuration. */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async check(@Res({ passthrough: true }) res: Response) {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok', latencyMs: Date.now() - started };
    } catch {
      res.status(503);
      return { status: 'degraded', database: 'unreachable' };
    }
  }
}
