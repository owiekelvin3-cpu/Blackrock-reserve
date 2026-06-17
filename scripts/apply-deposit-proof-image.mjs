import { PrismaClient } from "@prisma/client";
import {
  isDatabaseUnavailable,
  skipBuildMigrationIfNoDatabase,
  skipBuildMigrationOnVercel,
  warnAndSkip,
} from "./schema-migration-utils.mjs";

skipBuildMigrationOnVercel("Deposit proof image schema apply");
skipBuildMigrationIfNoDatabase("Deposit proof image schema apply");

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "DepositRequest" ADD COLUMN IF NOT EXISTS "proofImage" TEXT`,
];

async function main() {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
    console.log("OK:", sql.slice(0, 60));
  }
  console.log("Deposit proof image column ready");
}

main()
  .catch((e) => {
    if (isDatabaseUnavailable(e)) {
      warnAndSkip(
        "Deposit proof image schema apply (database unavailable)",
        "Start the dev server anyway; rerun when the database is online."
      );
      return;
    }
    console.error("Deposit proof image schema apply failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());