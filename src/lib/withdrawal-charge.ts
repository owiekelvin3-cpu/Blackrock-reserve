import type { Prisma, WithdrawalChargeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVE_WITHDRAWAL_STATUSES = ["PENDING", "AWAITING_CHARGE_PAYMENT"] as const;

export type ActiveUserWithdrawalCharge = {
  id: string;
  chargeType: WithdrawalChargeType;
  amountUsd: number;
  percentage: number | null;
  active: boolean;
  updatedAt: Date;
};

export function computeWithdrawalChargeAmount(
  charge: Pick<ActiveUserWithdrawalCharge, "chargeType" | "amountUsd" | "percentage">,
  withdrawalAmountUsd: number
): number {
  if (charge.chargeType === "PERCENTAGE" && charge.percentage != null && charge.percentage > 0) {
    const computed = Math.round(withdrawalAmountUsd * (charge.percentage / 100) * 100) / 100;
    return Math.max(0.01, computed);
  }
  return charge.amountUsd;
}

export function formatWithdrawalChargeSummary(
  charge: Pick<ActiveUserWithdrawalCharge, "chargeType" | "amountUsd" | "percentage">,
  formatCurrency: (amount: number) => string
): string {
  if (charge.chargeType === "PERCENTAGE" && charge.percentage != null) {
    return `${charge.percentage}% of withdrawal amount`;
  }
  return formatCurrency(charge.amountUsd);
}

export async function getActiveUserWithdrawalCharge(userId: string): Promise<ActiveUserWithdrawalCharge | null> {
  const charge = await prisma.userWithdrawalCharge.findUnique({
    where: { userId },
    select: {
      id: true,
      chargeType: true,
      amountUsd: true,
      percentage: true,
      active: true,
      updatedAt: true,
    },
  });
  if (!charge || !charge.active) return null;

  if (charge.chargeType === "PERCENTAGE") {
    const percentage = charge.percentage != null ? Number(charge.percentage) : null;
    if (percentage == null || percentage <= 0) return null;
    return {
      ...charge,
      amountUsd: 0,
      percentage,
    };
  }

  const amount = Number(charge.amountUsd);
  if (amount <= 0) return null;
  return {
    ...charge,
    amountUsd: amount,
    percentage: charge.percentage != null ? Number(charge.percentage) : null,
  };
}

export async function isWithdrawalChargePaid(withdrawalRequestId: string) {
  const payment = await prisma.withdrawalChargePayment.findUnique({
    where: { withdrawalRequestId },
    select: { status: true },
  });
  if (!payment) return true;
  return payment.status === "PAID";
}

export async function assertWithdrawalCanBeApproved(withdrawalRequestId: string) {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalRequestId },
    select: {
      status: true,
      assignedChargeAmount: true,
      chargePayment: { select: { status: true } },
    },
  });
  if (!withdrawal) throw new Error("Withdrawal not found");
  if (withdrawal.status === "AWAITING_CHARGE_PAYMENT") {
    throw new Error("Withdrawal is awaiting charge payment and cannot be approved yet");
  }
  if (withdrawal.assignedChargeAmount != null && Number(withdrawal.assignedChargeAmount) > 0) {
    if (!withdrawal.chargePayment || withdrawal.chargePayment.status !== "PAID") {
      throw new Error("Assigned withdrawal charge must be paid and verified before approval");
    }
  }
}

export async function markChargePaymentPaid(
  paymentId: string,
  adminId: string,
  reviewNote: string | undefined,
  tx: Prisma.TransactionClient = prisma
) {
  const existing = await tx.withdrawalChargePayment.findUnique({
    where: { id: paymentId },
    select: {
      withdrawalRequest: {
        select: { id: true, userId: true, accountId: true, amountUsd: true, status: true },
      },
    },
  });
  if (!existing?.withdrawalRequest) throw new Error("Charge payment not found");

  const { withdrawalRequest } = existing;
  const account = await tx.bankAccount.findFirst({
    where: { id: withdrawalRequest.accountId, userId: withdrawalRequest.userId },
    select: { balance: true },
  });
  if (!account) throw new Error("Withdrawal account not found");

  const pendingAgg = await tx.withdrawalRequest.aggregate({
    where: {
      userId: withdrawalRequest.userId,
      accountId: withdrawalRequest.accountId,
      status: "PENDING",
      id: { not: withdrawalRequest.id },
    },
    _sum: { amountUsd: true },
  });
  const reserved = Number(pendingAgg._sum.amountUsd ?? 0);
  const available = Number(account.balance) - reserved;
  const amountUsd = Number(withdrawalRequest.amountUsd);
  if (amountUsd > available) {
    throw new Error(
      `Insufficient balance to activate withdrawal. User has $${available.toFixed(2)} available on this account.`
    );
  }

  const payment = await tx.withdrawalChargePayment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      reviewedBy: adminId,
      reviewNote: reviewNote?.trim() || null,
    },
    select: { withdrawalRequestId: true, userId: true, amountUsd: true },
  });

  await tx.withdrawalRequest.update({
    where: { id: payment.withdrawalRequestId },
    data: { status: "PENDING" },
  });

  return payment;
}

export function formatWithdrawalStatus(status: string) {
  switch (status) {
    case "AWAITING_CHARGE_PAYMENT":
      return "Awaiting Charge Payment";
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function formatChargePaymentStatus(status: string) {
  switch (status) {
    case "UNPAID":
      return "Unpaid";
    case "PENDING_VERIFICATION":
      return "Pending Verification";
    case "PAID":
      return "Paid";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

export function buildWithdrawalChargeUpsertData(
  input: {
    chargeType: WithdrawalChargeType;
    amountUsd?: number;
    percentage?: number;
  },
  createdById: string
) {
  if (input.chargeType === "PERCENTAGE") {
    return {
      chargeType: "PERCENTAGE" as const,
      amountUsd: 0,
      percentage: input.percentage!,
      active: true,
      createdById,
    };
  }

  return {
    chargeType: "FIXED" as const,
    amountUsd: input.amountUsd!,
    percentage: null,
    active: true,
    createdById,
  };
}
