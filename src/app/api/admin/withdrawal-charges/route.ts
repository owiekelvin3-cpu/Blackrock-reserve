import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { getAdminWithdrawalCharges } from "@/lib/admin-data";
import { userWithdrawalChargeSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { invalidateAdminCaches } from "@/lib/admin-cache";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const data = await getAdminWithdrawalCharges();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin withdrawal charges GET error:", error);
    return NextResponse.json({ error: "Failed to load withdrawal charges" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = userWithdrawalChargeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id: parsed.data.userId, role: "USER" },
      select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const charge = await prisma.userWithdrawalCharge.upsert({
      where: { userId: parsed.data.userId },
      create: {
        userId: parsed.data.userId,
        amountUsd: parsed.data.amountUsd,
        active: true,
        createdById: session.user.id,
      },
      update: {
        amountUsd: parsed.data.amountUsd,
        active: true,
        createdById: session.user.id,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    await logAdminAction(
      session.user.id,
      "WITHDRAWAL_CHARGE_SET",
      {
        userId: user.id,
        userEmail: user.email,
        amountUsd: parsed.data.amountUsd,
      },
      user.id,
      getClientIp(req)
    );

    invalidateAdminCaches();

    return NextResponse.json({
      charge: {
        id: charge.id,
        userId: charge.userId,
        userName: charge.user.name,
        userEmail: charge.user.email,
        amountUsd: Number(charge.amountUsd),
        active: charge.active,
      },
      message: `Withdrawal charge set to ${formatCurrency(parsed.data.amountUsd)} for ${user.name}`,
    });
  } catch (error) {
    console.error("Admin withdrawal charges POST error:", error);
    return NextResponse.json({ error: "Failed to save withdrawal charge" }, { status: 500 });
  }
}
