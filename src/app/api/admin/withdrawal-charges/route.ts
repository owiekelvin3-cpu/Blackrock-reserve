import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { getAdminWithdrawalCharges } from "@/lib/admin-data";
import { userWithdrawalChargeSchema } from "@/lib/validations";
import { buildWithdrawalChargeUpsertData } from "@/lib/withdrawal-charge";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { invalidateAdminCaches } from "@/lib/admin-cache";
import { verifiedCustomerWhere } from "@/lib/customer-auth";

function formatChargeSavedMessage(
  chargeType: "FIXED" | "PERCENTAGE",
  amountUsd: number | undefined,
  percentage: number | undefined,
  targetLabel: string
) {
  if (chargeType === "PERCENTAGE") {
    return `Withdrawal charge set to ${percentage}% for ${targetLabel}`;
  }
  return `Withdrawal charge set to ${formatCurrency(amountUsd!)} for ${targetLabel}`;
}

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

    const chargeData = buildWithdrawalChargeUpsertData(parsed.data, session.user.id);

    if (parsed.data.applyToAll) {
      const users = await prisma.user.findMany({
        where: { ...verifiedCustomerWhere, role: "USER" },
        select: { id: true, name: true, email: true },
      });

      if (users.length === 0) {
        return NextResponse.json({ error: "No users found" }, { status: 404 });
      }

      await prisma.$transaction(
        users.map((user) =>
          prisma.userWithdrawalCharge.upsert({
            where: { userId: user.id },
            create: { userId: user.id, ...chargeData },
            update: chargeData,
          })
        )
      );

      await logAdminAction(
        session.user.id,
        "WITHDRAWAL_CHARGE_SET_ALL",
        {
          chargeType: parsed.data.chargeType,
          amountUsd: parsed.data.amountUsd ?? null,
          percentage: parsed.data.percentage ?? null,
          userCount: users.length,
        },
        undefined,
        getClientIp(req)
      );

      invalidateAdminCaches();

      return NextResponse.json({
        appliedCount: users.length,
        message: formatChargeSavedMessage(
          parsed.data.chargeType,
          parsed.data.amountUsd,
          parsed.data.percentage,
          `all ${users.length} users`
        ),
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: parsed.data.userId, role: "USER" },
      select: { id: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const charge = await prisma.userWithdrawalCharge.upsert({
      where: { userId: parsed.data.userId! },
      create: {
        userId: parsed.data.userId!,
        ...chargeData,
      },
      update: chargeData,
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
        chargeType: parsed.data.chargeType,
        amountUsd: parsed.data.amountUsd ?? null,
        percentage: parsed.data.percentage ?? null,
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
        chargeType: charge.chargeType,
        amountUsd: Number(charge.amountUsd),
        percentage: charge.percentage != null ? Number(charge.percentage) : null,
        active: charge.active,
      },
      message: formatChargeSavedMessage(
        parsed.data.chargeType,
        parsed.data.amountUsd,
        parsed.data.percentage,
        user.name
      ),
    });
  } catch (error) {
    console.error("Admin withdrawal charges POST error:", error);
    return NextResponse.json({ error: "Failed to save withdrawal charge" }, { status: 500 });
  }
}
