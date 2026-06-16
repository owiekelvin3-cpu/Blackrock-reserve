import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { adminUpdateCardRequest } from "@/lib/physical-cards";
import { adminCardRequestUpdateSchema } from "@/lib/validations";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { invalidateAdminCaches } from "@/lib/admin-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const { id } = await context.params;

  try {
    const body = await req.json();
    const parsed = adminCardRequestUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update" },
        { status: 400 }
      );
    }

    if (parsed.data.status === "DELIVERED") {
      if (!parsed.data.lastFour || !parsed.data.expiryMonth || !parsed.data.expiryYear) {
        return NextResponse.json(
          { error: "Last four digits and expiry are required when marking as delivered" },
          { status: 400 }
        );
      }
    }

    if (parsed.data.status === "REJECTED" && !parsed.data.rejectionReason?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const updated = await adminUpdateCardRequest(session.user.id, id, parsed.data);

    await logAdminAction(
      session.user.id,
      "CARD_REQUEST_UPDATE",
      { requestId: id, ...parsed.data },
      updated.userId,
      getClientIp(req)
    );

    await invalidateAdminCaches();

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update card request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
