import 'reflect-metadata';
import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiError } from './common/http/errors';
import { AllExceptionsFilter } from './common/http/exception.filter';
import { clientIp } from './common/http/client';
import { logger } from './common/logger';
import { runWithRequestContext } from './common/request-context';
import { APP_CONFIG } from './config/config.module';
import type { AppConfig } from './config/env';

const REQUEST_ID = /^[A-Za-z0-9:_-]{8,128}$/;

/**
 * Builds the API as a plain Express application. The same function serves the
 * local development server, the Vercel function and the test suite, so all
 * three run identical middleware in an identical order.
 */
export async function createApp(): Promise<{ app: NestExpressApplication; server: express.Express }> {
  const server = express();
  server.disable('x-powered-by');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server), {
    logger,
    bodyParser: false,
    abortOnError: false,
  });
  const config = app.get<AppConfig>(APP_CONFIG);
  logger.setLevel(config.logLevel);

  // 1. Request identity and access log.
  server.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-vercel-id'] ?? req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
    const started = process.hrtime.bigint();
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const entry = {
        msg: 'request',
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Math.round(ms),
      };
      if (res.statusCode >= 500) {
        logger.error(entry);
      } else if (req.path !== '/api/health') {
        logger.info(entry);
      }
    });
    runWithRequestContext({ requestId, ip: clientIp(req), method: req.method, path: req.path }, next);
  });

  // 2. Security headers. The API serves JSON only, so its policy forbids everything else.
  server.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] },
      },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: config.cookies.secure
        ? { maxAge: 63_072_000, includeSubDomains: true, preload: false }
        : false,
    }),
  );

  // 3. Responses are personal or fast-changing unless a route says otherwise.
  server.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // 4. Bodies: JSON only, small, strict. Parser failures become API errors
  //    here, before Nest would flatten them into a generic 400.
  server.use(express.json({ limit: '128kb', strict: true, type: ['application/json'] }));
  server.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
    const type = (error as { type?: unknown } | null)?.type;
    if (type === 'entity.parse.failed') {
      next(new ApiError(HttpStatus.BAD_REQUEST, 'invalid_json', 'The request body is not valid JSON.'));
    } else if (type === 'entity.too.large') {
      next(new ApiError(HttpStatus.PAYLOAD_TOO_LARGE, 'payload_too_large', 'That request is too large.'));
    } else {
      next(error);
    }
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.init();
  return { app, server };
}
