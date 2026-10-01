import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 does not read .env files on its own. Locally we load server/.env;
// on Vercel the variables are already in the process environment.
const envFile = path.join(__dirname, '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/** Must match the schema created by the first migration. */
const DATABASE_SCHEMA = 'sankofa';

/**
 * Migrations run over a session connection (Supabase port 5432), never the
 * transaction pooler, because DDL inside a migration needs a stable session.
 * The `schema` parameter keeps Prisma's own `_prisma_migrations` table inside
 * the private schema alongside everything else.
 */
function migrationUrl(): string | undefined {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) {
    return undefined;
  }
  const url = new URL(raw);
  url.searchParams.delete('pgbouncer');
  url.searchParams.delete('connection_limit');
  url.searchParams.set('schema', DATABASE_SCHEMA);
  return url.toString();
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: migrationUrl(),
  },
});
