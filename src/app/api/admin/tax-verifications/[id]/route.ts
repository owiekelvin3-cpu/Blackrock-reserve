import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminTaxVerificationDetail } from "@/lib/admin-loan-data";
import { taxRefundReviewSchema } from "@/lib/validations";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { notifyTaxRefundDecision } from "@/lib/loan-notifications";
import { invalidateAdminCaches } from "@/lib/admin-cache";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const detail = await getAdminTaxVerificationDetail(params.id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = taxRefundReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.taxRefundVerification.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "APPROVED" && parsed.data.status !== "APPROVED") {
      return NextResponse.json({ error: "Cannot change an approved verification" }, { status: 400 });
    }

    const updated = await prisma.taxRefundVerification.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote?.trim() || null,
        adminNotes: parsed.data.adminNotes?.trim() || existing.adminNotes,
        reviewedBy: session.user.id,
      },
    });

    if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
      await notifyTaxRefundDecision(
        existing.userId,
        existing.id,
        parsed.data.status === "APPROVED",
        parsed.data.reviewNote
      );
    } else if (parsed.data.status === "DOCUMENTS_REQUESTED") {
      await notifyTaxRefundDecision(existing.userId, existing.id, false, parsed.data.reviewNote ?? "Additional documents required.");
    }

    await logAdminAction(
      session.user.id,
      `TAX_REFUND_${parsed.data.status}`,
      { verificationId: params.id, reviewNote: parsed.data.reviewNote },
      existing.userId,
      getClientIp(req)
    );

    invalidateAdminCaches();
    return NextResponse.json({ verification: updated });
  } catch (error) {
    console.error("Tax verification review error:", error);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
