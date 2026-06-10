import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { LOCALE_CODES } from "@/lib/i18n/locales";

const patchSchema = z.object({
  preferredLocale: z
    .string()
    .refine((v) => (LOCALE_CODES as readonly string[]).includes(v))
    .optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredLocale: true, profileImage: true, name: true },
  });

  return NextResponse.json({
    preferredLocale: user?.preferredLocale ?? "en",
    profileImage: user?.profileImage ?? null,
    name: user?.name ?? null,
  });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.preferredLocale ? { preferredLocale: parsed.data.preferredLocale } : {}),
      },
      select: { preferredLocale: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
