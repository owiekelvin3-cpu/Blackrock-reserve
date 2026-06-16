import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { setUserVerificationBadge, mapVerificationServiceError } from "@/lib/verification-badge-service";
import { VERIFICATION_BADGE_TYPES } from "@/lib/verification-badge";

const patchSchema = z.object({
  badgeType: z.enum(VERIFICATION_BADGE_TYPES),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const { userId } = params;

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    const user = await setUserVerificationBadge({
      userId,
      badgeType: parsed.data.badgeType,
      adminId: session.user.id,
      note: parsed.data.note,
    });

    try {
      await logAdminAction(
        session.user.id,
        "VERIFICATION_BADGE_UPDATE",
        {
          badgeType: parsed.data.badgeType,
          note: parsed.data.note ?? null,
        },
        userId,
        getClientIp(req)
      );
    } catch (auditError) {
      console.error("Verification badge audit log failed:", auditError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verificationBadge: user.verificationBadge,
        verificationBadgeAt: user.verificationBadgeAt?.toISOString() ?? null,
        grantedBy: user.verificationBadgeBy,
      },
    });
  } catch (error) {
    const message = mapVerificationServiceError(error);
    const status = message === "User not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
