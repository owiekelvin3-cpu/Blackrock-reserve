import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function withConnectTimeout(url: string | undefined) {
  if (!url || url.includes("connect_timeout")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connect_timeout=10`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: withConnectTimeout(process.env.DATABASE_URL),
      },
    },
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
