import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { userWithdrawalChargeSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { invalidateAdminCaches } from "@/lib/admin-cache";

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = userWithdrawalChargeSchema.safeParse({ ...body, userId: params.userId });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.userWithdrawalCharge.findUnique({ where: { userId: params.userId } });
    if (!existing) return NextResponse.json({ error: "Charge not found" }, { status: 404 });

    const charge = await prisma.userWithdrawalCharge.update({
      where: { userId: params.userId },
      data: { amountUsd: parsed.data.amountUsd, active: true },
    });

    await logAdminAction(
      session.user.id,
      "WITHDRAWAL_CHARGE_UPDATED",
      { userId: params.userId, amountUsd: parsed.data.amountUsd },
      params.userId,
      getClientIp(req)
    );

    invalidateAdminCaches();

    return NextResponse.json({ charge: { ...charge, amountUsd: Number(charge.amountUsd) } });
  } catch (error) {
    console.error("Admin withdrawal charge PATCH error:", error);
    return NextResponse.json({ error: "Failed to update charge" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const existing = await prisma.userWithdrawalCharge.findUnique({ where: { userId: params.userId } });
    if (!existing) return NextResponse.json({ error: "Charge not found" }, { status: 404 });

    await prisma.userWithdrawalCharge.delete({ where: { userId: params.userId } });

    await logAdminAction(
      session.user.id,
      "WITHDRAWAL_CHARGE_REMOVED",
      { userId: params.userId },
      params.userId,
      getClientIp(req)
    );

    invalidateAdminCaches();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin withdrawal charge DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove charge" }, { status: 500 });
  }
}
