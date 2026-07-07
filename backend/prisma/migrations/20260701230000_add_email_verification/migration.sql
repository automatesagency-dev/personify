-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "emailVerifyExpires" TIMESTAMP(3);

-- Grandfather existing users as verified so they are not locked out of features
UPDATE "User" SET "emailVerified" = true;
