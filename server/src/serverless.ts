import type { IncomingMessage, ServerResponse } from 'node:http';
import type express from 'express';
import { createApp } from './bootstrap';
import { describeFailure } from './common/failure';
import { logger } from './common/logger';

/**
 * Vercel function entry point. The Nest application is built once per warm
 * instance and reused for every request that instance serves; only a cold
 * start pays the bootstrap cost.
 */
let ready: Promise<express.Express> | undefined;

function server(): Promise<express.Express> {
  ready ??= createApp()
    .then(({ server: instance }) => instance)
    .catch((error: unknown) => {
      // Let the next request try again rather than caching a failure forever.
      ready = undefined;
      throw error;
    });
  return ready;
}

function sendFailure(res: ServerResponse, status: number, message: string, error: unknown): void {
  if (res.headersSent || res.writableEnded) {
    return;
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: { code: 'unavailable', message, details: describeFailure(error) } }));
}

/**
 * An error that escapes every handler would otherwise end the process with
 * no reply, which Vercel shows only as FUNCTION_INVOCATION_FAILED. Instead,
 * requests still waiting are answered with what went wrong, and the process
 * then exits as it would have, so Vercel starts a clean instance.
 */
const waiting = new Set<ServerResponse>();
let crashing = false;

function crash(kind: string, error: unknown): void {
  logger.error({ msg: `API crashed (${kind})`, err: error });
  if (crashing) {
    return;
  }
  crashing = true;
  for (const res of waiting) {
    sendFailure(res, 500, 'The API stopped unexpectedly while answering this request.', error);
  }
  setTimeout(() => process.exit(1), 250);
}

process.on('uncaughtException', (error) => crash('uncaught exception', error));
process.on('unhandledRejection', (reason) => crash('unhandled rejection', reason));

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  waiting.add(res);
  res.on('close', () => waiting.delete(res));

  let app: express.Express;
  try {
    app = await server();
  } catch (error) {
    logger.error({ msg: 'API failed to start', err: error });
    sendFailure(res, 503, 'The API could not start. The details below say why.', error);
    return;
  }
  app(req as express.Request, res as express.Response);
}
