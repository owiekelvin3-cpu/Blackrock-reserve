import { PrismaClient } from "@prisma/client";
import {
  hasDatabaseUrl,
  isDatabaseUnavailable,
  skipBuildMigrationOnVercel,
  warnAndSkip,
} from "./schema-migration-utils.mjs";

skipBuildMigrationOnVercel("Verification badge schema apply");

const directUrl = process.env.DIRECT_URL?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!hasDatabaseUrl() || !directUrl) {
  console.warn(
    "Verification badge schema apply skipped: DATABASE_URL and DIRECT_URL must be set (Supabase direct connection on port 5432)."
  );
  process.exit(0);
}

console.log(`Using DIRECT_URL for migration (${directUrl.includes("pooler") ? "WARNING: still using pooler" : "direct host"})`);

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

const statements = [
  {
    label: "disable statement_timeout",
    sql: `SET statement_timeout = 0`,
  },
  {
    label: "enum VerificationBadgeType",
    sql: `DO $$ BEGIN
      CREATE TYPE "VerificationBadgeType" AS ENUM ('NONE', 'STANDARD', 'BUSINESS', 'GOLD');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  },
  {
    label: "enum VerificationBadgeAction",
    sql: `DO $$ BEGIN
      CREATE TYPE "VerificationBadgeAction" AS ENUM ('GRANTED', 'REVOKED', 'UPGRADED', 'DOWNGRADED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
  },
  {
    label: "column verificationBadge (nullable)",
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadge" "VerificationBadgeType"`,
  },
  {
    label: "backfill verificationBadge",
    sql: `UPDATE "User" SET "verificationBadge" = 'NONE' WHERE "verificationBadge" IS NULL`,
  },
  {
    label: "column verificationBadge NOT NULL",
    sql: `ALTER TABLE "User" ALTER COLUMN "verificationBadge" SET DEFAULT 'NONE'`,
    optional: true,
  },
  {
    label: "column verificationBadge NOT NULL constraint",
    sql: `ALTER TABLE "User" ALTER COLUMN "verificationBadge" SET NOT NULL`,
    optional: true,
  },
  {
    label: "column verificationBadgeAt",
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeAt" TIMESTAMP(3)`,
  },
  {
    label: "column verificationBadgeById",
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeById" TEXT`,
  },
  {
    label: "table VerificationBadgeHistory",
    sql: `CREATE TABLE IF NOT EXISTS "VerificationBadgeHistory" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "badgeType" "VerificationBadgeType" NOT NULL,
      "action" "VerificationBadgeAction" NOT NULL,
      "previousBadge" "VerificationBadgeType",
      "adminId" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VerificationBadgeHistory_pkey" PRIMARY KEY ("id")
    )`,
  },
  {
    label: "index userId_createdAt",
    sql: `CREATE INDEX IF NOT EXISTS "VerificationBadgeHistory_userId_createdAt_idx" ON "VerificationBadgeHistory"("userId", "createdAt")`,
    optional: true,
  },
  {
    label: "index createdAt",
    sql: `CREATE INDEX IF NOT EXISTS "VerificationBadgeHistory_createdAt_idx" ON "VerificationBadgeHistory"("createdAt")`,
    optional: true,
  },
  {
    label: "fk User.verificationBadgeById",
    sql: `DO $$ BEGIN
      ALTER TABLE "User" ADD CONSTRAINT "User_verificationBadgeById_fkey"
        FOREIGN KEY ("verificationBadgeById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    optional: true,
  },
  {
    label: "fk VerificationBadgeHistory.userId",
    sql: `DO $$ BEGIN
      ALTER TABLE "VerificationBadgeHistory" ADD CONSTRAINT "VerificationBadgeHistory_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    optional: true,
  },
  {
    label: "fk VerificationBadgeHistory.adminId",
    sql: `DO $$ BEGIN
      ALTER TABLE "VerificationBadgeHistory" ADD CONSTRAINT "VerificationBadgeHistory_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`,
    optional: true,
  },
];

async function main() {
  let skipped = 0;

  for (const step of statements) {
    try {
      console.log(`Running: ${step.label}…`);
      await prisma.$executeRawUnsafe(step.sql);
      console.log(`OK: ${step.label}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (step.optional) {
        skipped += 1;
        console.warn(`SKIP (optional): ${step.label} — ${message}`);
      } else {
        console.error(`FAIL: ${step.label} — ${message}`);
        throw error;
      }
    }
  }

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
      AND column_name IN ('verificationBadge', 'verificationBadgeAt', 'verificationBadgeById')
  `);

  if (!Array.isArray(cols) || cols.length < 3) {
    throw new Error(`Migration incomplete — only ${Array.isArray(cols) ? cols.length : 0}/3 User columns found`);
  }

  console.log(skipped > 0
    ? `Verification badge schema ready (${skipped} optional step(s) skipped)`
    : "Verification badge schema ready");
}

main()
  .catch((e) => {
    if (isDatabaseUnavailable(e)) {
      warnAndSkip("Verification badge schema apply (database unavailable)", e);
      return;
    }
    console.error("Verification badge schema apply failed:", e.message ?? e);
    if (!directUrl && databaseUrl) {
      console.error("Tip: set DIRECT_URL in .env to the Supabase direct URL (port 5432, not pooler).");
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
