import { PrismaClient } from "@prisma/client";

function isTransactionPooler(url) {
  return url.includes(":6543") || url.includes("pgbouncer=true");
}

function deriveSessionPoolerUrl(poolerUrl) {
  try {
    const normalized = poolerUrl.replace(/^postgresql:/i, "postgres:");
    const url = new URL(normalized);
    if (!url.hostname.includes("pooler.supabase.com")) return null;
    url.port = "5432";
    url.searchParams.delete("pgbouncer");
    if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
    return url.toString().replace(/^postgres:/i, "postgresql:");
  } catch {
    return null;
  }
}

const sessionUrl = deriveSessionPoolerUrl(process.env.DATABASE_URL ?? "");
if (!sessionUrl) {
  console.error("Could not derive session pooler URL");
  process.exit(1);
}

console.log("Testing session pooler:", sessionUrl.replace(/:([^:@/]+)@/, ":****@"));

const prisma = new PrismaClient({ datasources: { db: { url: sessionUrl } } });

try {
  await prisma.$transaction(async (tx) => {
    const count = await tx.user.count();
    await tx.$queryRaw`SELECT 1`;
    console.log("Interactive transaction OK. Users:", count);
  });
} catch (err) {
  console.error("FAILED:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
