-- CreateEnum
CREATE TYPE "BookAccessType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "BookSourceType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "EntitlementGrantSource" AS ENUM ('PURCHASE', 'ADMIN_GRANT', 'PROMOTION');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'FLUTTERWAVE', 'MTN', 'AIRTEL', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "accessType" "BookAccessType" NOT NULL DEFAULT 'FREE',
    "sourceType" "BookSourceType" NOT NULL DEFAULT 'INTERNAL',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "license" TEXT,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "coverImageUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookFile" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "checksum" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "grantedById" TEXT,
    "source" "EntitlementGrantSource" NOT NULL DEFAULT 'PURCHASE',
    "orderRef" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT,
    "userId" TEXT,
    "bookId" TEXT,
    "entitlementId" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_isPublished_accessType_idx" ON "Book"("isPublished", "accessType");

-- CreateIndex
CREATE INDEX "Book_sourceType_idx" ON "Book"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "BookFile_bucket_path_key" ON "BookFile"("bucket", "path");

-- CreateIndex
CREATE INDEX "BookFile_bookId_isPrimary_idx" ON "BookFile"("bookId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_userId_bookId_key" ON "Entitlement"("userId", "bookId");

-- CreateIndex
CREATE INDEX "Entitlement_bookId_userId_idx" ON "Entitlement"("bookId", "userId");

-- CreateIndex
CREATE INDEX "Entitlement_expiresAt_idx" ON "Entitlement"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_providerEventId_key" ON "PaymentEvent"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_idempotencyKey_key" ON "PaymentEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentEvent_status_createdAt_idx" ON "PaymentEvent"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookFile" ADD CONSTRAINT "BookFile_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
