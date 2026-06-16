import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name IN ('verificationBadge', 'verificationBadgeAt', 'verificationBadgeById')
    `);
    console.log("User verification columns:", cols);

    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'VerificationBadgeHistory'
    `);
    console.log("VerificationBadgeHistory table:", tables);

    const users = await prisma.user.findMany({
      where: { role: "USER" },
      take: 2,
      select: { id: true, name: true, verificationBadge: true },
    });
    console.log("Sample users:", users);
  } catch (err) {
    console.error("Check failed:", err.message);
  }
}

main().finally(() => prisma.$disconnect());
