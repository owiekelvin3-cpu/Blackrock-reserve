import { prisma } from "@/lib/prisma";

export type DbSchemaCapabilities = {
  verificationBadges: boolean;
  bankAccountNumbers: boolean;
  verificationHistory: boolean;
  depositProofImage: boolean;
};

let cached: { caps: DbSchemaCapabilities; at: number } | null = null;
const CACHE_MS = 60_000;

export function resetDbSchemaCapabilitiesCache() {
  cached = null;
}

export async function getDbSchemaCapabilities(): Promise<DbSchemaCapabilities> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.caps;
  }

  try {
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'User' AND column_name = 'verificationBadge')
          OR (table_name = 'BankAccount' AND column_name = 'accountNumber')
          OR (table_name = 'DepositRequest' AND column_name = 'proofImage')
        )
    `)) as { table_name: string; column_name: string }[];

    const tableRows = (await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'VerificationBadgeHistory'
    `)) as { table_name: string }[];

    const caps: DbSchemaCapabilities = {
      verificationBadges: rows.some(
        (r) => r.table_name === "User" && r.column_name === "verificationBadge"
      ),
      bankAccountNumbers: rows.some(
        (r) => r.table_name === "BankAccount" && r.column_name === "accountNumber"
      ),
      verificationHistory: tableRows.length > 0,
      depositProofImage: rows.some(
        (r) => r.table_name === "DepositRequest" && r.column_name === "proofImage"
      ),
    };

    cached = { caps, at: Date.now() };
    return caps;
  } catch {
    return {
      verificationBadges: false,
      bankAccountNumbers: false,
      verificationHistory: false,
      depositProofImage: false,
    };
  }
}

export function userVerificationBadgeSelect(caps: DbSchemaCapabilities) {
  return caps.verificationBadges ? ({ verificationBadge: true } as const) : {};
}

export function bankAccountNumberSelect(caps: DbSchemaCapabilities) {
  return caps.bankAccountNumbers ? ({ accountNumber: true } as const) : {};
}
