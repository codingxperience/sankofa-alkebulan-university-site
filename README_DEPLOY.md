## Deployment and Keys

Local dev

- Start backend in dev: `cd sankofa-modern/backend && npm install && npm run start:dev`
- Start frontend: `cd sankofa-modern/frontend && npm install && npm run start`

Supabase

- Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to `backend/.env` (service role key, keep secret).
- Add `SUPABASE_ANON_KEY` and `SUPABASE_URL` in frontend environment file.

Stripe

- Add `STRIPE_SECRET` (webhook signing secret) to `backend/.env` to enable webhook verification at `POST /payment/webhook`.

Prisma Migrations in CI

- A GitHub Actions workflow `.github/workflows/prisma-migrate.yml` is included. Set the repository secret `DATABASE_URL` to your Supabase Postgres connection string before running the workflow.

Notes

- Never commit `backend/.env` containing service or secret keys to your repository.
