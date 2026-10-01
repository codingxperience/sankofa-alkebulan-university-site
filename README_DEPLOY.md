# Deploying Sankofa Alkebulan University

The site and its API deploy together as **one Vercel project** from the
**repository root**, backed by a **Supabase Postgres** database.

```
Browser ──► Vercel edge ──► static Angular site (frontend/browser)
                       └──► /api/*  ──► one Vercel Function (api/index.js → server/dist)
                                            └──► Supabase Postgres (schema "sankofa")
```

The site and API share one origin, so the staff session cookie stays
first-party and no CORS is involved.

## 1. Vercel project settings

| Setting | Value |
| --- | --- |
| Root Directory | *(empty — the repository root)* |
| Framework Preset | Other |
| Build / Install / Output | taken from `vercel.json` — leave the overrides off |
| Node.js version | 22.x (also pinned in the root `package.json`) |

`vercel.json` installs both `server/` and `frontend/`, runs
`scripts/vercel-build.mjs`, serves `frontend/browser`, routes `/api/*` to the
function, runs the function in **Dublin (`dub1`)** — next to the Supabase
database in eu-west-1 — and schedules the daily maintenance job.

> `frontend/vercel.json` is from the earlier, site-only setup. If the Vercel
> project's Root Directory is set to `frontend`, the API is **not** deployed —
> forms will fail. Set the Root Directory back to the repository root.

## 2. Environment variables

Set these under **Project → Settings → Environment Variables**. Names match
`server/.env.example`, which explains each one.

| Name | Production | Notes |
| --- | --- | --- |
| `DATABASE_URL` | required | Supabase **transaction pooler** (port 6543) with `?pgbouncer=true` |
| `DIRECT_URL` | required | Supabase **session pooler** (port 5432); used only by migrations during the build |
| `APP_SECRET` | required | 32+ random characters; never change it once live (it signs stored hashes) |
| `PUBLIC_SITE_URL` | required | e.g. `https://your-domain` — links in every email use it |
| `CRON_SECRET` | recommended | any long random string; Vercel sends it to the maintenance job |
| `ADMIN_SETUP_KEY` | first deploy only | 24+ characters; lets you create the first owner at `/admin/sign-in`, then remove it |
| `RESEND_API_KEY`, `EMAIL_FROM` | for email | without them, emails wait in the outbox |
| `EMAIL_REPLY_TO` | optional | defaults to sanalkeu@outlook.com |
| `STAFF_NOTIFICATION_EMAILS` | optional | comma-separated; who is alerted about new messages until offices are configured |
| `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH` | optional | card checkout; set both or neither |
| `DATABASE_CA_CERT` | optional | Supabase CA certificate (PEM) to verify the database's TLS certificate |

Generate secrets with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Preview deployments** never run migrations. Give Preview its own database
(a Supabase branch or a second project), or leave Preview without database
variables. Never point previews at production with a different schema.

## 3. What a production build does

`scripts/vercel-build.mjs`:

1. builds the API (`prisma generate`, TypeScript) into `server/dist`;
2. **production only:** applies pending migrations (`prisma migrate deploy`
   over `DIRECT_URL`), then adds reference data that is missing — the seven
   offices, the store catalogue, the Convening event and the journal archive.
   Existing records are never overwritten, so prices and stock edited in the
   console survive every deploy;
3. builds the Angular site into `frontend/browser`.

Migrations can also be applied by hand from the **Database migrations**
GitHub workflow (needs a `DIRECT_URL` repository secret), or locally:

```sh
cd server && npm ci && npx prisma migrate deploy
```

## 4. First sign-in

1. Deploy with `ADMIN_SETUP_KEY` set.
2. Open `/admin/sign-in`; it offers **First-time setup**. Enter the key, your
   name, email and a password of 12+ characters.
3. Remove `ADMIN_SETUP_KEY` from Vercel and redeploy.
4. Invite colleagues from **Team**. Each invitation is a single-use link; if
   email is not configured yet, copy the link from the screen and send it.

Locked out, or setting up from a laptop with database access:

```sh
cd server && npm run build && npm run staff:create-owner -- --email you@example.org --name "Your Name"
```

## 5. Email (Resend)

1. Verify the sending domain in Resend.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that domain).
3. Redeploy. Messages that were waiting in the outbox are sent by the daily
   job; anything older than 72 hours is marked expired rather than sent late.

## 6. Card payments (Flutterwave, optional)

1. Set `FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_WEBHOOK_HASH`.
2. On the Flutterwave dashboard, set the webhook URL to
   `https://your-domain/api/store/payments/flutterwave/webhook` and the secret
   hash to the same value as `FLUTTERWAVE_WEBHOOK_HASH`.

Without them, card orders are still accepted and the bursary desk sends a
payment link by hand; mobile money is always confirmed in the console.

## 7. Supabase

All tables live in a private `sankofa` schema with Row Level Security enabled
and no grants to Supabase's `anon` or `authenticated` roles: the database is
reached only through the API, never directly from browsers. Tables left over
from the earlier site in `public` (including `app_user`, which holds password
hashes) get Row Level Security switched on by a migration, which closes them to
Supabase's public Data API; nothing in them is changed or deleted.

## 8. After deploying — a short check

- `/api/health` returns `{"status":"ok","database":"ok", …}`.
- The contact form returns a reference such as `SAU-Q-XXXX-XXXX`, and the
  message appears in **Inbox**.
- **Settings** in the console shows whether email, card payments and the daily
  housekeeping job are switched on.

## Local development

```sh
# API — needs a Postgres database; copy server/.env.example to server/.env
cd server && npm ci && npx prisma migrate deploy && npm run build && npm run db:seed
npm run dev        # http://127.0.0.1:3000/api

# Site — proxies /api to 127.0.0.1:3000 (frontend/proxy.conf.json)
cd frontend && npm ci && npm start
```

Tests run against a separate database whose name contains `test`
(`server/.env.test`): `cd server && npm test`.
