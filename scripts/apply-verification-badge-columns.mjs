import { PrismaClient } from "@prisma/client";

const url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
if (!url) {
  console.error("Set DIRECT_URL or DATABASE_URL in .env");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

const steps = [
  `SET statement_timeout = 0`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadge" "VerificationBadgeType"`,
  `UPDATE "User" SET "verificationBadge" = 'NONE' WHERE "verificationBadge" IS NULL`,
  `ALTER TABLE "User" ALTER COLUMN "verificationBadge" SET DEFAULT 'NONE'`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeAt" TIMESTAMP(3)`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationBadgeById" TEXT`,
  `CREATE TABLE IF NOT EXISTS "VerificationBadgeHistory" (
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
];

async function main() {
  for (let i = 0; i < steps.length; i++) {
    const sql = steps[i];
    console.log(`Step ${i + 1}/${steps.length}…`);
    await prisma.$executeRawUnsafe(sql);
    console.log(`OK step ${i + 1}`);
  }

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User'
      AND column_name IN ('verificationBadge', 'verificationBadgeAt', 'verificationBadgeById')
  `);
  console.log("Columns found:", cols);
}

main()
  .catch((e) => {
    console.error("Failed:", e.message ?? e);
    console.error("\nIf this hangs or times out, run scripts/verification-badge-supabase.sql in Supabase SQL Editor.");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
