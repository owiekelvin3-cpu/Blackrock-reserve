import { NextResponse } from "next/server";
import { isNextAuthConfigured } from "@/lib/auth-config";
import { isEmailConfigured, getEmailProvider } from "@/lib/email";

export async function GET() {
  return NextResponse.json({
    ok: isNextAuthConfigured(),
    auth: {
      configured: isNextAuthConfigured(),
      hasSecret: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
      secretLength: process.env.NEXTAUTH_SECRET?.trim().length ?? 0,
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
    email: {
      configured: isEmailConfigured(),
      provider: getEmailProvider(),
    },
    admin: {
      emailConfigured: Boolean(process.env.ADMIN_EMAIL?.trim()),
      passwordless: process.env.ADMIN_PASSWORDLESS === "true",
    },
  });
}
