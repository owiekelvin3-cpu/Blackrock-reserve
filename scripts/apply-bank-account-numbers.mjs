import { PrismaClient } from "@prisma/client";

const directUrl = process.env.DIRECT_URL;
const prisma = new PrismaClient(
  directUrl
    ? {
        datasources: { db: { url: directUrl } },
      }
    : undefined
);

function generateBankAccountNumber() {
  const n = Math.floor(1000000000 + Math.random() * 9000000000);
  return `BR-${n}`;
}

async function allocateUniqueBankAccountNumber() {
  for (let attempt = 0; attempt < 25; attempt++) {
    const accountNumber = generateBankAccountNumber();
    const [bankHit, jointHit] = await Promise.all([
      prisma.bankAccount.findUnique({ where: { accountNumber }, select: { id: true } }),
      prisma.jointAccount.findUnique({ where: { accountNumber }, select: { id: true } }),
    ]);
    if (!bankHit && !jointHit) return accountNumber;
  }
  throw new Error("Could not allocate a unique account number");
}

const statements = [
  {
    label: "statement_timeout",
    sql: `SET statement_timeout = '180000'`,
    optional: true,
  },
  {
    label: "column accountNumber",
    sql: `ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT`,
  },
  {
    label: "unique index accountNumber",
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "BankAccount_accountNumber_key" ON "BankAccount"("accountNumber")`,
  },
];

async function consolidateUserAccountNumbers(userId) {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, accountNumber: true },
  });

  if (accounts.length === 0) return;

  let primary = accounts.find((a) => a.type === "checking") ?? accounts[0];
  let accountNumber = primary.accountNumber;

  if (!accountNumber) {
    const fromOther = accounts.find((a) => a.accountNumber);
    accountNumber = fromOther?.accountNumber ?? (await allocateUniqueBankAccountNumber());
  }

  await prisma.bankAccount.update({
    where: { id: primary.id },
    data: { accountNumber },
  });

  for (const account of accounts) {
    if (account.id !== primary.id && account.accountNumber) {
      await prisma.bankAccount.update({
        where: { id: account.id },
        data: { accountNumber: null },
      });
    }
  }
}

async function main() {
  for (const step of statements) {
    try {
      await prisma.$executeRawUnsafe(step.sql);
      console.log(`OK: ${step.label}`);
    } catch (error) {
      if (step.optional) {
        console.warn(`Skipped optional step ${step.label}:`, error instanceof Error ? error.message : error);
      } else {
        throw error;
      }
    }
  }

  const users = await prisma.user.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;
  for (const user of users) {
    await consolidateUserAccountNumbers(user.id);
    processed += 1;
    if (processed % 25 === 0) console.log(`Consolidated ${processed}/${users.length} users…`);
  }

  console.log(`Bank account numbers ready — one per user on primary checking (${processed} users).`);
}

main()
  .catch((e) => {
    console.error("Bank account number schema apply failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
