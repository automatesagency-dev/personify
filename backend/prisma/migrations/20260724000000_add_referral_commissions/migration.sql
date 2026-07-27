-- AlterTable: link a user to whoever referred them
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;

-- CreateTable: commission ledger
CREATE TABLE "Commission" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "refereeId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'aud',
  "type" TEXT NOT NULL,
  "sourceInvoiceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "availableAt" TIMESTAMP(3) NOT NULL,
  "creditedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_sourceInvoiceId_key" ON "Commission"("sourceInvoiceId");
CREATE INDEX "Commission_referrerId_status_idx" ON "Commission"("referrerId", "status");
CREATE INDEX "Commission_refereeId_idx" ON "Commission"("refereeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill referredById from existing referral redemptions (personal codes only)
UPDATE "User" u
SET "referredById" = rc."ownerId"
FROM "ReferralUsage" ru
JOIN "ReferralCode" rc ON ru."codeId" = rc."id"
WHERE ru."userId" = u."id"
  AND rc."ownerId" IS NOT NULL
  AND rc."ownerId" <> u."id";
