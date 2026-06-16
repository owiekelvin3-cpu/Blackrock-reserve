import { PrismaClient } from "@prisma/client";

const directUrl = process.env.DIRECT_URL?.trim();
const prisma = new PrismaClient(
  directUrl ? { datasources: { db: { url: directUrl } } } : undefined
);

const statements = [
  {
    label: "UserNotification.actorUserId column",
    sql: `ALTER TABLE "UserNotification" ADD COLUMN IF NOT EXISTS "actorUserId" TEXT`,
  },
  {
    label: "UserNotification.actorUserId index",
    sql: `CREATE INDEX IF NOT EXISTS "UserNotification_actorUserId_idx" ON "UserNotification"("actorUserId")`,
  },
];

async function main() {
  for (const step of statements) {
    await prisma.$executeRawUnsafe(step.sql);
    console.log(`OK: ${step.label}`);
  }
  console.log("Notification actorUserId column ready.");
}

main()
  .catch((e) => {
    console.error("Notification actor schema apply failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
