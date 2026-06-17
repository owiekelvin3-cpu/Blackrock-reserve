import { PrismaClient } from "@prisma/client";
import {
  isDatabaseUnavailable,
  skipBuildMigrationIfNoDatabase,
  skipBuildMigrationOnVercel,
  warnAndSkip,
} from "./schema-migration-utils.mjs";

skipBuildMigrationOnVercel("Physical cards schema apply");
skipBuildMigrationIfNoDatabase("Physical cards schema apply");

const directUrl = process.env.DIRECT_URL?.trim();
const prisma = new PrismaClient(
  directUrl ? { datasources: { db: { url: directUrl } } } : undefined
);

const statements = [
  `SET statement_timeout = 0`,
  `DO $$ BEGIN
    CREATE TYPE "PhysicalCardTier" AS ENUM ('STANDARD', 'PREMIUM', 'BLACK_ELITE');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "CardRequestStatus" AS ENUM (
      'PENDING_REVIEW', 'UNDER_VERIFICATION', 'APPROVED', 'CARD_PRODUCTION',
      'SHIPPED', 'DELIVERED', 'REJECTED', 'CANCELLED'
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "BankCardStatus" AS ENUM (
      'ACTIVE', 'PENDING_ACTIVATION', 'FROZEN', 'EXPIRED', 'BLOCKED'
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "CardRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardTier" "PhysicalCardTier" NOT NULL,
    "status" "CardRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateRegion" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "deliveryInstructions" TEXT,
    "trackingNumber" TEXT,
    "shippingCarrier" TEXT,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNote" TEXT,
    "statusEtaDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardRequest_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CardRequest_userId_createdAt_idx" ON "CardRequest"("userId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "CardRequest_status_createdAt_idx" ON "CardRequest"("status", "createdAt")`,
  `CREATE TABLE IF NOT EXISTS "BankCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardRequestId" TEXT,
    "cardholderName" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "tier" "PhysicalCardTier" NOT NULL DEFAULT 'STANDARD',
    "network" "BankCardNetwork" NOT NULL DEFAULT 'VISA',
    "status" "BankCardStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankCard_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BankCard_cardRequestId_key" ON "BankCard"("cardRequestId")`,
  `CREATE INDEX IF NOT EXISTS "BankCard_userId_idx" ON "BankCard"("userId")`,
  `CREATE TABLE IF NOT EXISTS "CardRequestEvent" (
    "id" TEXT NOT NULL,
    "cardRequestId" TEXT NOT NULL,
    "status" "CardRequestStatus" NOT NULL,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CardRequestEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CardRequestEvent_cardRequestId_createdAt_idx" ON "CardRequestEvent"("cardRequestId", "createdAt")`,
  `DO $$ BEGIN
    ALTER TABLE "CardRequest" ADD CONSTRAINT "CardRequest_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "BankCard" ADD CONSTRAINT "BankCard_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "BankCard" ADD CONSTRAINT "BankCard_cardRequestId_fkey"
      FOREIGN KEY ("cardRequestId") REFERENCES "CardRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "CardRequestEvent" ADD CONSTRAINT "CardRequestEvent_cardRequestId_fkey"
      FOREIGN KEY ("cardRequestId") REFERENCES "CardRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "CardRequestEvent" ADD CONSTRAINT "CardRequestEvent_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
];

async function main() {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("Physical cards schema ready");
}

main()
  .catch((e) => {
    if (isDatabaseUnavailable(e)) {
      warnAndSkip("Physical cards schema apply (database unavailable)", e);
      return;
    }
    console.error("Physical cards schema apply failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
