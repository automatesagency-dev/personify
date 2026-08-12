-- AlterTable: Personify credit wallet (in cents)
ALTER TABLE "User" ADD COLUMN "creditCents" INTEGER NOT NULL DEFAULT 0;
