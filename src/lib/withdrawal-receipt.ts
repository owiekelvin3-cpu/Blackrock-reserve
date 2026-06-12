import { formatWithdrawalStatus } from "@/lib/withdrawal-charge";
import { getWithdrawalMethod, getWithdrawalMethodLabel } from "@/lib/withdrawal-methods";

export type WithdrawalReceiptData = {
  id: string;
  amountUsd: number;
  method: string;
  methodLabel: string;
  destination: string;
  destinationExtra?: string | null;
  accountName?: string;
  status: string;
  statusLabel: string;
  displayStatus: string;
  currentStatus: string;
  createdAt: string;
  estimatedProcessingTime?: string;
  requiresChargePayment?: boolean;
  chargeAmount?: number | null;
  note?: string | null;
};

export function buildWithdrawalReceiptData(input: {
  id: string;
  amountUsd: number;
  method: string;
  destination: string;
  destinationExtra?: string | null;
  note?: string | null;
  accountName?: string | null;
  status: string;
  createdAt: string | Date;
  assignedChargeAmount?: number | null;
}): WithdrawalReceiptData {
  const hasCharge =
    input.status === "AWAITING_CHARGE_PAYMENT" &&
    input.assignedChargeAmount != null &&
    input.assignedChargeAmount > 0;
  const methodDef = getWithdrawalMethod(input.method);
  const statusLabel = formatWithdrawalStatus(input.status);
  const createdAt =
    typeof input.createdAt === "string" ? input.createdAt : input.createdAt.toISOString();

  return {
    id: input.id,
    amountUsd: input.amountUsd,
    method: input.method,
    methodLabel: getWithdrawalMethodLabel(input.method),
    destination: input.destination,
    destinationExtra: input.destinationExtra?.trim() || null,
    accountName: input.accountName ?? undefined,
    status: input.status,
    statusLabel,
    displayStatus: "Withdrawal Initiated",
    currentStatus: hasCharge ? "Awaiting Charge Payment" : "Awaiting Confirmation",
    createdAt,
    estimatedProcessingTime: methodDef?.timing,
    requiresChargePayment: hasCharge,
    chargeAmount: input.assignedChargeAmount,
    note: input.note?.trim() || null,
  };
}
