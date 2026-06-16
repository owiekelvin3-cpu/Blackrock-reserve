import { NextResponse } from "next/server";
import { isNextAuthConfigured } from "@/lib/auth-config";
import { isEmailConfigured, getEmailProvider } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let databaseOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const authOk = isNextAuthConfigured();
  const emailOk = isEmailConfigured();

  return NextResponse.json({
    ok: authOk && databaseOk,
    auth: {
      configured: authOk,
      hasSecret: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
      secretLength: process.env.NEXTAUTH_SECRET?.trim().length ?? 0,
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
    database: {
      connected: databaseOk,
    },
    email: {
      configured: emailOk,
      provider: getEmailProvider(),
    },
    admin: {
      emailConfigured: Boolean(process.env.ADMIN_EMAIL?.trim()),
      passwordless: process.env.ADMIN_PASSWORDLESS === "true",
    },
  });
}
