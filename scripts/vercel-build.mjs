// Builds the site and its API for Vercel, in order:
//
//   1. the API (Prisma client + TypeScript) into server/dist
//   2. on production deployments only: apply pending database migrations,
//      then add any reference data that is missing (never overwrites edits)
//   3. the Angular site into frontend/browser
//
// Migrations run only for production so that a preview of an unmerged
// branch can never change the live database's structure.
import { spawnSync } from 'node:child_process';

function run(label, command, args, cwd) {
  console.log(`\n▸ ${label}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`\n✖ ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

const production = process.env.VERCEL_ENV === 'production';

run('Building the API', 'npm', ['run', 'build'], 'server');

if (production) {
  for (const name of ['DATABASE_URL', 'DIRECT_URL', 'APP_SECRET']) {
    if (!process.env[name]) {
      console.error(`\n✖ ${name} is not set for Production. Add it under Settings → Environment Variables.`);
      process.exit(1);
    }
  }
  run('Applying database migrations', 'npx', ['prisma', 'migrate', 'deploy'], 'server');
  run('Adding missing reference data', 'node', ['dist/cli/seed.js'], 'server');
} else {
  console.log(`\n▸ Skipping migrations (${process.env.VERCEL_ENV ?? 'local'} build).`);
}

run('Building the site', 'npm', ['run', 'build:vercel'], 'frontend');
