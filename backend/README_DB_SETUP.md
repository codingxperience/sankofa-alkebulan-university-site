# Database Setup (Supabase + Prisma)

This backend uses PostgreSQL via Prisma. Recommended managed provider: Supabase.

## Initial setup

1. Create a Supabase project: `https://supabase.com`
2. Copy your Postgres connection string.
3. Create `backend/.env` from `backend/.env.example` and set:

```bash
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
JWT_SECRET="your-jwt-secret"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
```

4. Install dependencies:

```bash
npm install
```

5. Run Prisma migration and generate client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

6. Start backend:

```bash
npm run start:dev
```

## Server-side Supabase proxy

If direct DB connectivity is blocked (IPv4/IPv6 issues), admin endpoints can still work through Supabase service key auth.

Required env:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Books and entitlements (paid/free library)

This project now includes secure book delivery and access control:

- `Book`, `BookFile`, `Entitlement`, and `PaymentEvent` Prisma models
- Public catalog endpoints
- Paid/free access checks
- Short-lived signed URLs for internal files
- Webhook-based entitlement grant on Stripe checkout completion

### Run the new migration

```bash
npx prisma migrate dev --name books_entitlements
npx prisma generate
```

### Storage setup

1. Create a private Supabase Storage bucket (default name: `books`)
2. Upload internal files into that bucket
3. Register each file path via admin endpoint

### Required env for book delivery

```bash
BOOKS_STORAGE_BUCKET=books
BOOK_SIGNED_URL_TTL_SECONDS=900
STRIPE_SECRET=sk_live_or_test...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_or_test...
```

### API routes

- Public:
- `GET /books`
- `GET /books/:slug`
- `GET /books/:slug/public-access-url`
- `GET /books/external/search?q=...`
- Authenticated user:
- `GET /books/:slug/access-url`
- Admin (Supabase admin auth):
- `GET /admin/books`
- `POST /admin/books`
- `POST /admin/books/:bookId/files`
- `POST /admin/books/:bookId/entitlements`
- `DELETE /admin/books/:bookId/entitlements/:userId`

### Paid checkout metadata

When creating Stripe checkout sessions via `POST /payment/create-checkout-session`, include:

```json
{
  "userId": "app-user-id",
  "bookId": "book-id",
  "purpose": "book_purchase"
}
```

On `checkout.session.completed`, the webhook grants or refreshes entitlement automatically.

## Live admin dashboard data

The admin dashboard now reads live data from PostgreSQL for posts, events, products, and orders.

### Run the admin fields migration

```bash
npx prisma migrate dev --name admin_live_fields
npx prisma generate
```

### Admin API routes (JWT + admin role)

- `GET /admin/dashboard`
- `GET/POST/PUT/DELETE /admin/posts`
- `GET/POST/PUT/DELETE /admin/events`
- `GET/POST/PUT/DELETE /admin/products`
- `GET/POST/PUT/DELETE /admin/orders`

## Notes

- Keep `.env` out of source control.
- Store production secrets in your hosting provider's secret manager.
- Run `npx prisma generate` after any Prisma schema change.
