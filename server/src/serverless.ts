import type { IncomingMessage, ServerResponse } from 'node:http';
import type express from 'express';
import { createApp } from './bootstrap';
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

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let app: express.Express;
  try {
    app = await server();
  } catch (error) {
    logger.error({ msg: 'API failed to start', err: error });
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      JSON.stringify({
        error: { code: 'unavailable', message: 'The service is starting up or misconfigured. Please try again shortly.' },
      }),
    );
    return;
  }
  app(req as express.Request, res as express.Response);
}
