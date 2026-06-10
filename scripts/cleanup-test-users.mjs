/**
 * Remove automated test / seed customer accounts from the database.
 * Usage: node --env-file=.env scripts/cleanup-test-users.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_EMAIL_PATTERNS = [
  /@example\.com$/i,
  /@mailinator\.com$/i,
  /^testuser\d+@/i,
  /^flowtest\d+@/i,
  /^br-email-test-/i,
  /^br-verify-/i,
];

function isTestEmail(email) {
  return TEST_EMAIL_PATTERNS.some((re) => re.test(email));
}

async function main() {
  const candidates = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  const toDelete = candidates.filter((u) => isTestEmail(u.email));

  if (toDelete.length === 0) {
    console.log("No test customer accounts found.");
    return;
  }

  console.log("Removing test accounts:");
  for (const user of toDelete) {
    console.log(`  - ${user.email} (${user.name})`);
    await prisma.user.delete({ where: { id: user.id } });
  }

  const removed = await prisma.contactMessage.deleteMany({
    where: {
      OR: [
        { email: "verify@blackrockreserve.site" },
        { name: { in: ["Site Verify", "Live Verify"] } },
        { subject: { contains: "verification", mode: "insensitive" } },
      ],
    },
  });

  console.log(`Done. Removed ${toDelete.length} user(s), ${removed.count} contact message(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
