import { createApp } from './bootstrap';
import { logger } from './common/logger';
import { APP_CONFIG } from './config/config.module';
import type { AppConfig } from './config/env';

/** Local development server. In production the API runs as a Vercel function (see serverless.ts). */
async function main(): Promise<void> {
  const { app } = await createApp();
  const config = app.get<AppConfig>(APP_CONFIG);
  await app.listen(config.port, '127.0.0.1');
  logger.info({ msg: `API listening on http://127.0.0.1:${config.port}/api` });
}

main().catch((error: unknown) => {
  logger.error({ msg: 'API failed to start', err: error });
  process.exit(1);
});
