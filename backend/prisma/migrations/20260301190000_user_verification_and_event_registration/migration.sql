-- AlterTable
ALTER TABLE "app_user"
ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN "verificationNote" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_createdAt_idx" ON "EventRegistration"("eventId", "createdAt");

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
