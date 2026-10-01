# Sankofa Alkebulan University

The university's website, the API behind it, and the console its staff use to
answer what arrives.

| Folder | What it is |
| --- | --- |
| `frontend/` | The public site and the staff console (`/admin`) — Angular 21 |
| `server/` | The API — NestJS 11, Prisma 7, PostgreSQL on Supabase |
| `api/` | The Vercel Function that serves the API |
| `scripts/` | The Vercel build |
| `backend/` | The previous backend, no longer used by the site |

Deployment, environment variables and first sign-in: **[README_DEPLOY.md](README_DEPLOY.md)**.

## What the API does

- **Messages** from the contact and admissions forms, routed to one of seven
  offices, acknowledged by email, and answered from the console.
- **Admissions**: a six-step application saved as it is typed, resumable on
  any device through a private link, and reviewed through to a decision.
- **Events**: registration with capacity, a waiting list and check-in; each
  event defines the choices its form offers.
- **Store**: prices and limited-edition stock checked on the server; mobile
  money confirmed by staff, card payments through Flutterwave.
- **Journal**: articles with full-text search, scheduling and archiving.
- **Mailing list**: consent recorded word for word, unsubscribe and erasure.

## How it is built to be safe

- Staff passwords are hashed with scrypt; sessions are opaque tokens kept in
  `__Host-` HttpOnly, SameSite=Strict cookies, stored only as hashes, ending
  after 2 idle hours or 12 hours in all. Repeated wrong passwords lock an
  account for a growing period.
- Roles grant permissions, checked on every request; every change made in the
  console is recorded in an audit log that the console cannot edit.
- Requests from other sites are refused (Fetch Metadata and Origin checks);
  every write is rate-limited per visitor, with limits kept in Postgres so they
  hold across serverless instances.
- All input is validated with Zod; resubmitted forms are recognised by a
  request id instead of being stored twice; bots filling a hidden field are
  quietly dropped.
- The database lives in a private schema with Row Level Security and no
  grants to Supabase's public roles. Only the API can reach it.
- Emails are queued in an outbox — for public forms, in the same transaction
  as the submission — and sent separately, so a slow or failing mail provider
  never loses a submission.

## Working on it

```sh
cd server && npm ci && npm run dev        # API on http://127.0.0.1:3000/api (needs server/.env)
cd frontend && npm ci && npm start        # site on http://localhost:4200, /api proxied to the API
cd server && npm test                     # API tests against the database in server/.env.test
```
