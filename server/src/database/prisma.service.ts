import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import type { PoolConfig } from 'pg';
import { InjectConfig } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { logger } from '../common/logger';

/** Schema-qualified table name for raw SQL; Prisma's own queries are qualified by the adapter. */
export const SCHEMA = 'sankofa';
export const table = (name: string) => Prisma.raw(`"${SCHEMA}"."${name}"`);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Connection settings for node-postgres.
 *
 * In production DATABASE_URL points at Supabase's transaction pooler
 * (port 6543). Each serverless instance keeps a very small pool, and the
 * pooler multiplexes thousands of those onto a few real connections. Prisma's
 * pg adapter does not name prepared statements, which is exactly what a
 * transaction pooler requires.
 */
export function poolConfig(config: AppConfig): PoolConfig {
  const url = new URL(config.database.url);
  // Parameters meant for Prisma's old Rust engine or libpq; node-postgres
  // would either ignore them or, for sslmode, override the TLS settings below.
  for (const param of ['pgbouncer', 'connection_limit', 'pool_timeout', 'schema', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
    url.searchParams.delete(param);
  }
  const local = LOCAL_HOSTS.has(url.hostname);

  return {
    connectionString: url.toString(),
    max: config.database.poolSize,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    query_timeout: 20_000,
    application_name: 'sankofa-api',
    // Supabase requires TLS. Supply DATABASE_CA_CERT (the project's CA from the
    // dashboard) to also verify the server's identity.
    ssl: local
      ? false
      : config.database.caCert
        ? { ca: config.database.caCert, rejectUnauthorized: true }
        : { rejectUnauthorized: false },
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@InjectConfig() config: AppConfig) {
    super({
      adapter: new PrismaPg(poolConfig(config), {
        schema: SCHEMA,
        onPoolError: (error) => logger.error({ msg: 'Database pool error', err: error }),
      }),
      log: [{ emit: 'event', level: 'warn' }],
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

/** True when a Prisma error is a unique-constraint violation, optionally on a given column. */
export function isUniqueViolation(error: unknown, column?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  if (!column) {
    return true;
  }
  return JSON.stringify(error.meta ?? {}).includes(column);
}

export function isNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
