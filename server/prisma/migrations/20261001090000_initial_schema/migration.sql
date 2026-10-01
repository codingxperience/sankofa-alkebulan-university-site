-- Sankofa Alkebulan University — initial schema.
--
-- Generated from prisma/schema.prisma, then extended by hand with what Prisma
-- cannot express: the trigger that maintains the journal's full-text search column, CHECK constraints
-- that keep money and stock arithmetic honest at the database level, and the
-- privilege lockdown at the end of this file.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sankofa";

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'ADMIN', 'ADMISSIONS', 'COMMUNICATIONS', 'EVENTS', 'COMMERCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "StaffTokenPurpose" AS ENUM ('INVITATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Office" AS ENUM ('ADMISSIONS', 'PROGRAMMES', 'RESEARCH', 'STUDENT_LIFE', 'GOVERNANCE', 'MEDIA', 'CENTRAL');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'UNDELIVERABLE');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('CONTACT_PAGE', 'ADMISSIONS_DESK', 'PORTAL_FORM');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'OPEN', 'AWAITING_REPLY', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "NoteKind" AS ENUM ('NOTE', 'REPLY');

-- CreateEnum
CREATE TYPE "ApplicationPathway" AS ENUM ('UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CONDITIONAL_OFFER', 'OFFER', 'WAITLISTED', 'DECLINED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('APPAREL', 'ARTIFACT', 'BOOK', 'DIGITAL', 'MEDIA');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'PREORDER', 'SOLD_OUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'FULFILLING', 'DISPATCHED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfilmentMethod" AS ENUM ('DIGITAL', 'PICKUP', 'COURIER', 'EXPRESS');

-- CreateEnum
CREATE TYPE "PaymentRail" AS ENUM ('MOBILE_MONEY', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriberSource" AS ENUM ('NEWSLETTER', 'EVENT_REGISTRATION', 'STORE_ORDER', 'ADMISSIONS', 'ADMIN');

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "roles" "StaffRole"[],
    "offices" "Office"[],
    "status" "StaffStatus" NOT NULL DEFAULT 'INVITED',
    "password_hash" TEXT,
    "password_changed_at" TIMESTAMPTZ(3),
    "failed_sign_ins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "last_sign_in_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_tokens" (
    "id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "purpose" "StaffTokenPurpose" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "issued_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_label" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "hits" INTEGER NOT NULL,
    "reset_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "outbound_emails" (
    "id" UUID NOT NULL,
    "template" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "to_name" TEXT,
    "reply_to" TEXT,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "provider_message_id" TEXT,
    "related_type" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_routes" (
    "office" "Office" NOT NULL,
    "label" TEXT NOT NULL,
    "notify_emails" TEXT[],
    "response_target" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "office_routes_pkey" PRIMARY KEY ("office")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "office" "Office" NOT NULL,
    "source" "InquirySource" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "origin" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "assignee_id" UUID,
    "first_replied_at" TIMESTAMPTZ(3),
    "resolved_at" TIMESTAMPTZ(3),
    "client_request_id" UUID,
    "submitter_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry_notes" (
    "id" UUID NOT NULL,
    "inquiry_id" UUID NOT NULL,
    "author_id" UUID,
    "kind" "NoteKind" NOT NULL DEFAULT 'NOTE',
    "body" TEXT NOT NULL,
    "email_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "pathway" "ApplicationPathway" NOT NULL,
    "intake" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "email" TEXT,
    "given_name" TEXT,
    "family_name" TEXT,
    "residence" TEXT,
    "first_choice" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "completed_steps" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "resume_token_hash" TEXT NOT NULL,
    "assignee_id" UUID,
    "submitted_at" TIMESTAMPTZ(3),
    "decided_at" TIMESTAMPTZ(3),
    "client_request_id" UUID,
    "submitter_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "author_id" UUID,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "venue" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kampala',
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3),
    "registration_closes_at" TIMESTAMPTZ(3),
    "capacity" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "options" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "place" TEXT,
    "organisation" TEXT,
    "role" TEXT,
    "attendee_category" TEXT,
    "attendance_mode" TEXT,
    "days" TEXT,
    "interests" TEXT[],
    "question" TEXT,
    "access_needs" TEXT,
    "wants_updates" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "client_request_id" UUID,
    "submitter_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "has_sizes" BOOLEAN NOT NULL DEFAULT false,
    "is_digital" BOOLEAN NOT NULL DEFAULT false,
    "stock_remaining" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "delivery_address" TEXT,
    "fulfilment" "FulfilmentMethod" NOT NULL,
    "payment_rail" "PaymentRail" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "payment_provider" TEXT,
    "payment_reference" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal_cents" INTEGER NOT NULL,
    "delivery_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "access_key_hash" TEXT NOT NULL,
    "staff_note" TEXT,
    "paid_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "client_request_id" UUID,
    "submitter_hash" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "line_total_cents" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "order_id" UUID,
    "kind" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "author_name" TEXT NOT NULL,
    "categories" TEXT[],
    "tags" TEXT[],
    "reading_minutes" INTEGER NOT NULL DEFAULT 1,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(3),
    "search_vector" tsvector,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" "SubscriberSource" NOT NULL,
    "consent_text" TEXT NOT NULL,
    "consented_at" TIMESTAMPTZ(3) NOT NULL,
    "unsubscribed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_token_hash_key" ON "staff_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "staff_sessions_staff_id_revoked_at_idx" ON "staff_sessions"("staff_id", "revoked_at");

-- CreateIndex
CREATE INDEX "staff_sessions_expires_at_idx" ON "staff_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "staff_tokens_token_hash_key" ON "staff_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "staff_tokens_staff_id_purpose_idx" ON "staff_tokens"("staff_id", "purpose");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actor_id_created_at_idx" ON "audit_events"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets"("reset_at");

-- CreateIndex
CREATE INDEX "outbound_emails_status_next_attempt_at_idx" ON "outbound_emails"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "outbound_emails_related_type_related_id_idx" ON "outbound_emails"("related_type", "related_id");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_reference_key" ON "inquiries"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_client_request_id_key" ON "inquiries"("client_request_id");

-- CreateIndex
CREATE INDEX "inquiries_status_office_created_at_idx" ON "inquiries"("status", "office", "created_at" DESC);

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at" DESC);

-- CreateIndex
CREATE INDEX "inquiries_email_idx" ON "inquiries"("email");

-- CreateIndex
CREATE INDEX "inquiries_assignee_id_status_idx" ON "inquiries"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "inquiry_notes_inquiry_id_created_at_idx" ON "inquiry_notes"("inquiry_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_reference_key" ON "applications"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "applications_resume_token_hash_key" ON "applications"("resume_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "applications_client_request_id_key" ON "applications"("client_request_id");

-- CreateIndex
CREATE INDEX "applications_status_pathway_submitted_at_idx" ON "applications"("status", "pathway", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "applications_email_idx" ON "applications"("email");

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "application_notes_application_id_created_at_idx" ON "application_notes"("application_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_status_starts_at_idx" ON "events"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_code_key" ON "event_registrations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_client_request_id_key" ON "event_registrations"("client_request_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_status_created_at_idx" ON "event_registrations"("event_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_email_key" ON "event_registrations"("event_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_status_position_idx" ON "products"("status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_payment_reference_key" ON "orders"("payment_reference");

-- CreateIndex
CREATE UNIQUE INDEX "orders_client_request_id_key" ON "orders"("client_request_id");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_customer_email_idx" ON "orders"("customer_email");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "payment_events_order_id_idx" ON "payment_events"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "articles_search_vector_idx" ON "articles" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "articles_categories_idx" ON "articles" USING GIN ("categories");

-- CreateIndex
CREATE INDEX "articles_tags_idx" ON "articles" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "subscribers_unsubscribed_at_created_at_idx" ON "subscribers"("unsubscribed_at", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_tokens" ADD CONSTRAINT "staff_tokens_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_tokens" ADD CONSTRAINT "staff_tokens_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_routes" ADD CONSTRAINT "office_routes_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Journal search ───────────────────────────────────────────────────────
-- search_vector is maintained by a trigger rather than a generated column so
-- that Prisma's schema diffing sees a plain tsvector and stays quiet.
-- The 'simple' configuration is deliberate: the journal publishes in English,
-- French and Swahili, and language-specific stemming would mangle two of them.
CREATE FUNCTION "articles_refresh_search_vector"() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = ''
AS $$
BEGIN
    NEW."search_vector" :=
        pg_catalog.setweight(pg_catalog.to_tsvector('simple'::regconfig, coalesce(NEW."title", '')), 'A') ||
        pg_catalog.setweight(pg_catalog.to_tsvector('simple'::regconfig, coalesce(NEW."excerpt", '')), 'B') ||
        pg_catalog.setweight(
            pg_catalog.to_tsvector(
                'simple'::regconfig,
                pg_catalog.regexp_replace(coalesce(NEW."body_html", ''), '<[^>]+>', ' ', 'g')
            ),
            'C'
        );
    RETURN NEW;
END
$$;

CREATE TRIGGER "articles_refresh_search_vector"
    BEFORE INSERT OR UPDATE OF "title", "excerpt", "body_html" ON "articles"
    FOR EACH ROW EXECUTE FUNCTION "articles_refresh_search_vector"();

-- ─── Integrity rules ──────────────────────────────────────────────────────
-- Emails are compared case-insensitively everywhere, so the uniqueness rules
-- above only hold if every stored address is lowercase.
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_failed_sign_ins_nonnegative" CHECK ("failed_sign_ins" >= 0);
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "applications" ADD CONSTRAINT "applications_email_lowercase" CHECK ("email" IS NULL OR "email" = lower("email"));
ALTER TABLE "applications" ADD CONSTRAINT "applications_version_positive" CHECK ("version" >= 1);
ALTER TABLE "events" ADD CONSTRAINT "events_capacity_positive" CHECK ("capacity" IS NULL OR "capacity" > 0);
ALTER TABLE "events" ADD CONSTRAINT "events_ends_after_start" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at");
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "rate_limit_buckets" ADD CONSTRAINT "rate_limit_buckets_hits_positive" CHECK ("hits" > 0);

-- Stock can never go below zero: a concurrent checkout that would oversell a
-- limited edition fails here instead of succeeding twice.
ALTER TABLE "products" ADD CONSTRAINT "products_price_nonnegative" CHECK ("price_cents" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonnegative" CHECK ("stock_remaining" IS NULL OR "stock_remaining" >= 0);

-- Order totals must add up, line by line and in sum.
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_email_lowercase" CHECK ("customer_email" = lower("customer_email"));
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_consistent" CHECK (
    "subtotal_cents" >= 0 AND "delivery_cents" >= 0 AND "total_cents" = "subtotal_cents" + "delivery_cents"
);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_amounts_consistent" CHECK (
    "quantity" > 0 AND "unit_price_cents" >= 0 AND "line_total_cents" = "quantity" * "unit_price_cents"
);

-- ─── Privileges ───────────────────────────────────────────────────────────
-- Supabase's Data API connects as `anon` and `authenticated`. This schema is
-- not exposed to it, and these statements make sure it never can be: the API
-- roles hold no privileges here, and row level security (with no policies)
-- denies them every row even if a grant is added by mistake later. The API
-- server connects as the owner of these tables, which RLS does not restrict.
DO $$
DECLARE
    api_role text;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            EXECUTE format('REVOKE ALL ON SCHEMA %I FROM %I', current_schema(), api_role);
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM %I', current_schema(), api_role);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM %I', current_schema(), api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM %I', current_schema(), api_role);
        END IF;
    END LOOP;
END
$$;

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = current_schema() LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', current_schema(), t.tablename);
    END LOOP;
END
$$;
