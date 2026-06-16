-- Run this in Supabase Dashboard → SQL Editor (uses direct DB connection, avoids pooler timeouts)
-- Verification badge schema for Blackrock Reserve

SET statement_timeout = 0;

DO $$ BEGIN
  CREATE TYPE "VerificationBadgeType" AS ENUM ('NONE', 'STANDARD', 'BUSINESS', 'GOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationBadgeAction" AS ENUM ('GRANTED', 'REVOKED', 'UPGRADED', 'DOWNGRADED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadge" "VerificationBadgeType";
UPDATE "User" SET "verificationBadge" = 'NONE' WHERE "verificationBadge" IS NULL;
ALTER TABLE "User" ALTER COLUMN "verificationBadge" SET DEFAULT 'NONE';
ALTER TABLE "User" ALTER COLUMN "verificationBadge" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeById" TEXT;

CREATE TABLE IF NOT EXISTS "VerificationBadgeHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeType" "VerificationBadgeType" NOT NULL,
  "action" "VerificationBadgeAction" NOT NULL,
  "previousBadge" "VerificationBadgeType",
  "adminId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationBadgeHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VerificationBadgeHistory_userId_createdAt_idx"
  ON "VerificationBadgeHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "VerificationBadgeHistory_createdAt_idx"
  ON "VerificationBadgeHistory"("createdAt");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_verificationBadgeById_fkey"
    FOREIGN KEY ("verificationBadgeById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "VerificationBadgeHistory" ADD CONSTRAINT "VerificationBadgeHistory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "VerificationBadgeHistory" ADD CONSTRAINT "VerificationBadgeHistory_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
