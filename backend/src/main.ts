import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configuredOrigins = String(
    process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '',
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const allowAnyOrigin = configuredOrigins.length === 0;

  // Enable CORS for frontend and production domains.
  app.enableCors({
    origin: (origin, callback) => {
      if (allowAnyOrigin || !origin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  });

  // Enable raw body for Stripe webhook verification
  app.use((req, res, next) => {
    if (req.originalUrl && req.originalUrl.startsWith('/payment/webhook')) {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        (req as any).rawBody = data;
        next();
      });
    } else {
      next();
    }
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
  console.log('Backend server running on http://localhost:3000');
}
bootstrap();
