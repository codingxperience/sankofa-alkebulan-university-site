import { z } from 'zod';

/**
 * Every environment variable the API reads, validated once at start-up.
 * Anything missing or malformed stops the process with a message naming the
 * variable, instead of surfacing later as a confusing runtime failure.
 */
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const emailList = z
  .string()
  .trim()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )
  .pipe(z.array(z.email()));

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(20).default(3),
    DATABASE_CA_CERT: optionalString,

    /**
     * Key for the one-way hashes of visitors' IP addresses (rate limits, spotting
     * repeat submissions), so raw addresses are never stored.
     */
    APP_SECRET: z.string().min(32, 'APP_SECRET must be at least 32 characters'),

    /** Public origin of the site, e.g. https://sankofa.university. */
    PUBLIC_SITE_URL: optionalString,
    /** Set automatically by Vercel; used when PUBLIC_SITE_URL is absent. */
    VERCEL_PROJECT_PRODUCTION_URL: optionalString,
    VERCEL_ENV: optionalString,

    /** Vercel sends `Authorization: Bearer $CRON_SECRET` to scheduled jobs. */
    CRON_SECRET: optionalString,

    /**
     * One-time key for creating the first owner account from the admin sign-in
     * screen. Only works while no staff account exists; remove it afterwards.
     */
    ADMIN_SETUP_KEY: z
      .string()
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .pipe(z.string().min(24, 'ADMIN_SETUP_KEY must be at least 24 characters').optional())
      .optional(),

    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    EMAIL_REPLY_TO: z.email().default('sanalkeu@outlook.com'),
    STAFF_NOTIFICATION_EMAILS: emailList.default(['sanalkeu@outlook.com']),

    FLUTTERWAVE_SECRET_KEY: optionalString,
    FLUTTERWAVE_WEBHOOK_HASH: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }
    if (!env.PUBLIC_SITE_URL && !env.VERCEL_PROJECT_PRODUCTION_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['PUBLIC_SITE_URL'],
        message: 'PUBLIC_SITE_URL is required in production (links in emails depend on it)',
      });
    }
    if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM'],
        message: 'EMAIL_FROM is required when RESEND_API_KEY is set',
      });
    }
    if (env.FLUTTERWAVE_SECRET_KEY && !env.FLUTTERWAVE_WEBHOOK_HASH) {
      ctx.addIssue({
        code: 'custom',
        path: ['FLUTTERWAVE_WEBHOOK_HASH'],
        message: 'FLUTTERWAVE_WEBHOOK_HASH is required when FLUTTERWAVE_SECRET_KEY is set',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export interface AppConfig {
  readonly env: Env['NODE_ENV'];
  readonly isProduction: boolean;
  readonly port: number;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly database: {
    readonly url: string;
    readonly schema: 'sankofa';
    readonly poolSize: number;
    readonly caCert?: string;
  };
  readonly secret: string;
  readonly siteUrl: string;
  readonly cronSecret?: string;
  readonly adminSetupKey?: string;
  readonly email: {
    readonly resendApiKey?: string;
    readonly from?: string;
    readonly replyTo: string;
    readonly staffNotificationEmails: readonly string[];
  };
  readonly payments: {
    readonly flutterwaveSecretKey?: string;
    readonly flutterwaveWebhookHash?: string;
  };
  readonly cookies: {
    /** `__Host-` cookies must be Secure, so the prefix is only used over HTTPS. */
    readonly secure: boolean;
    readonly prefix: string;
  };
}

export class ConfigurationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment configuration:\n  - ${issues.join('\n  - ')}`);
    this.name = 'ConfigurationError';
  }
}

function resolveSiteUrl(env: Env): string {
  const raw =
    env.PUBLIC_SITE_URL ??
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
    'http://localhost:4200';
  return raw.replace(/\/+$/, '');
}

/**
 * Values copied from a .env file into a hosting dashboard often keep their
 * quotes (`"postgresql://…"`) or pick up stray spaces. Both are removed, so a
 * correctly copied value works whichever way it was pasted.
 */
export function cleanEnvValue(value: string): string {
  const trimmed = value.trim();
  const quoted = /^(["'])([\s\S]*)\1$/.exec(trimmed);
  return quoted ? quoted[2].trim() : trimmed;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([name, value]) => [name, value === undefined ? undefined : cleanEnvValue(value)]),
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    throw new ConfigurationError(
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`),
    );
  }
  const env = parsed.data;
  const isProduction = env.NODE_ENV === 'production';
  const siteUrl = resolveSiteUrl(env);
  const secure = siteUrl.startsWith('https://');

  return {
    env: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: {
      url: env.DATABASE_URL,
      schema: 'sankofa',
      poolSize: env.DATABASE_POOL_SIZE,
      caCert: env.DATABASE_CA_CERT,
    },
    secret: env.APP_SECRET,
    siteUrl,
    cronSecret: env.CRON_SECRET,
    adminSetupKey: env.ADMIN_SETUP_KEY,
    email: {
      resendApiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      replyTo: env.EMAIL_REPLY_TO.toLowerCase(),
      staffNotificationEmails: env.STAFF_NOTIFICATION_EMAILS,
    },
    payments: {
      flutterwaveSecretKey: env.FLUTTERWAVE_SECRET_KEY,
      flutterwaveWebhookHash: env.FLUTTERWAVE_WEBHOOK_HASH,
    },
    cookies: {
      secure,
      prefix: secure ? '__Host-' : '',
    },
  };
}
