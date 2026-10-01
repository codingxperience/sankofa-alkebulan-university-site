// Builds the site and its API for Vercel, in order:
//
//   1. production only: check every setting the database steps need, and
//      report all problems at once, before any time is spent building
//   2. the API (Prisma client + TypeScript) into server/dist
//   3. production only: apply pending database migrations, then add any
//      reference data that is missing (never overwrites edits)
//   4. the Angular site into frontend/browser
//
// Migrations run only for production so that a preview of an unmerged
// branch can never change the live database's structure.
import { spawnSync } from 'node:child_process';

function run(label, command, args, cwd) {
  console.log(`\n▸ ${label}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`\n✖ ${label} failed — see the lines above for the reason.`);
    process.exit(result.status ?? 1);
  }
}

/** Same rule as the API (server/src/config/env.ts): pasted quotes and stray spaces are dropped. */
function clean(value) {
  const trimmed = value.trim();
  const quoted = /^(["'])([\s\S]*)\1$/.exec(trimmed);
  return quoted ? quoted[2].trim() : trimmed;
}

function databaseProblem(name, value, expectedPort, purpose) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return `${name} is not a valid address. Paste the full connection string from Supabase, starting with postgresql://`;
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    return `${name} must start with postgresql://`;
  }
  if (/YOUR-PASSWORD/i.test(value)) {
    return `${name} still contains the [YOUR-PASSWORD] placeholder. Replace it with the database password.`;
  }
  if (url.hostname.endsWith('pooler.supabase.com') && url.port !== expectedPort) {
    return `${name} uses port ${url.port || '(none)'}; it should be ${expectedPort} (${purpose}).`;
  }
  return null;
}

/** Everything the production database steps need, checked together so one deploy shows every problem. */
function checkProductionSettings() {
  for (const name of ['DATABASE_URL', 'DIRECT_URL', 'APP_SECRET']) {
    if (process.env[name] !== undefined) {
      process.env[name] = clean(process.env[name]);
    }
  }
  const { DATABASE_URL, DIRECT_URL, APP_SECRET } = process.env;
  const problems = [];

  if (!DATABASE_URL) {
    problems.push('DATABASE_URL is missing — Supabase’s “Transaction pooler” connection string (port 6543).');
  } else {
    const problem = databaseProblem('DATABASE_URL', DATABASE_URL, '6543', 'Supabase’s transaction pooler');
    if (problem) problems.push(problem);
  }
  if (!DIRECT_URL) {
    problems.push('DIRECT_URL is missing — Supabase’s “Session pooler” connection string (port 5432).');
  } else {
    const problem = databaseProblem('DIRECT_URL', DIRECT_URL, '5432', 'Supabase’s session pooler');
    if (problem) problems.push(problem);
  }
  if (!APP_SECRET) {
    problems.push('APP_SECRET is missing — any random text of at least 32 characters.');
  } else if (APP_SECRET.length < 32) {
    problems.push(`APP_SECRET is ${APP_SECRET.length} characters long; it needs at least 32.`);
  }

  if (problems.length) {
    console.error('\n✖ This production build cannot reach the database yet.\n');
    for (const problem of problems) {
      console.error(`   • ${problem}`);
    }
    console.error(
      '\n   Add them in Vercel under Project → Settings → Environment Variables, with “Production” ticked,\n' +
        '   then redeploy. Paste each value on its own, without the NAME= part. README_DEPLOY.md lists every setting.\n',
    );
    process.exit(1);
  }
  console.log('\n▸ Production settings are present.');
}

const production = process.env.VERCEL_ENV === 'production';

if (production) {
  checkProductionSettings();
}

run('Building the API', 'npm', ['run', 'build'], 'server');

if (production) {
  run('Applying database migrations', 'npx', ['prisma', 'migrate', 'deploy'], 'server');
  run('Adding missing reference data', 'node', ['dist/cli/seed.js'], 'server');
} else {
  console.log(`\n▸ Skipping migrations (${process.env.VERCEL_ENV ?? 'local'} build).`);
}

run('Building the site', 'npm', ['run', 'build:vercel'], 'frontend');
