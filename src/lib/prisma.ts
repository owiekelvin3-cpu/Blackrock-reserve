import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function appendParam(url: string, param: string) {
  return `${url}${url.includes("?") ? "&" : "?"}${param}`;
}

function isPoolerUrl(url: string) {
  return url.includes("pgbouncer") || url.includes(":6543") || url.includes("pooler.supabase.com");
}

function withPoolSettings(url: string | undefined) {
  if (!url) return url;
  let result = url;
  if (!result.includes("connect_timeout")) {
    result = appendParam(result, "connect_timeout=10");
  }
  if (!result.includes("pool_timeout")) {
    result = appendParam(result, "pool_timeout=30");
  }
  // Supabase pooler allows ~5 connections — keep Prisma pool small
  if (isPoolerUrl(result) && !result.includes("connection_limit")) {
    result = appendParam(result, "connection_limit=3");
  }
  return result;
}

function createPrismaClient() {
  const dbUrl = withPoolSettings(process.env.DATABASE_URL);
  const options: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };

  // Only override the datasource when a URL exists — passing `undefined` breaks `next build`
  if (dbUrl) {
    options.datasources = { db: { url: dbUrl } };
  }

  return new PrismaClient(options);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
