-- CreateTable
CREATE TABLE "FounderPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'visionary',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "design" JSONB,
    "basicInfo" JSONB,
    "contact" JSONB,
    "services" JSONB,
    "portfolio" JSONB,
    "featured" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FounderPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FounderPage_userId_key" ON "FounderPage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FounderPage_username_key" ON "FounderPage"("username");

-- CreateIndex
CREATE INDEX "FounderPage_username_idx" ON "FounderPage"("username");

-- AddForeignKey
ALTER TABLE "FounderPage" ADD CONSTRAINT "FounderPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
