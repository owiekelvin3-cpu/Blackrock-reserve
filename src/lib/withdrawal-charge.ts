import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVE_WITHDRAWAL_STATUSES = ["PENDING", "AWAITING_CHARGE_PAYMENT"] as const;

export async function getActiveUserWithdrawalCharge(userId: string) {
  const charge = await prisma.userWithdrawalCharge.findUnique({
    where: { userId },
    select: { id: true, amountUsd: true, active: true, updatedAt: true },
  });
  if (!charge || !charge.active) return null;
  const amount = Number(charge.amountUsd);
  if (amount <= 0) return null;
  return { ...charge, amountUsd: amount };
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
