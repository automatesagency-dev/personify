-- AlterTable: bonus generation wallet
ALTER TABLE "User"
  ADD COLUMN "bonusImages" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bonusTexts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GrantCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "grantImages" INTEGER NOT NULL DEFAULT 0,
  "grantTexts" INTEGER NOT NULL DEFAULT 0,
  "maxUses" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrantCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrantRedemption" (
  "id" TEXT NOT NULL,
  "codeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrantRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrantCode_code_key" ON "GrantCode"("code");
CREATE UNIQUE INDEX "GrantRedemption_codeId_userId_key" ON "GrantRedemption"("codeId", "userId");

-- AddForeignKey
ALTER TABLE "GrantRedemption" ADD CONSTRAINT "GrantRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "GrantCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrantRedemption" ADD CONSTRAINT "GrantRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
