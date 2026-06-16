import { prisma, runInteractiveTransaction } from "@/lib/prisma";
import { reduceProfitBalanceOnSpend } from "@/lib/spendable-balance";
import { getAvailableBalance } from "@/lib/withdrawal-balance";
import { createUserNotification } from "@/lib/user-notifications";
import {
  isValidBankAccountNumber,
  normalizeBankAccountNumber,
  findPrimaryCheckingAccount,
} from "@/lib/bank-account-number";

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export async function lookupMemberTransferRecipient(
  senderId: string,
  recipientAccountNumberRaw: string
) {
  const accountNumber = normalizeBankAccountNumber(recipientAccountNumberRaw);
  if (!isValidBankAccountNumber(accountNumber)) {
    return { found: false as const, reason: "invalid" as const };
  }

  const recipientAccount = await prisma.bankAccount.findUnique({
    where: { accountNumber },
    include: {
      user: {
        select: { id: true, name: true, role: true, status: true },
      },
    },
  });

  if (!recipientAccount?.user) {
    return { found: false as const, reason: "not_found" as const };
  }

  const recipient = recipientAccount.user;
  if (recipient.role !== "USER" || recipient.status !== "ACTIVE") {
    return { found: false as const, reason: "not_found" as const };
  }

  if (recipient.id === senderId) {
    return { found: false as const, reason: "self" as const };
  }

  const primary = await findPrimaryCheckingAccount(recipient.id);

  return {
    found: true as const,
    name: recipient.name,
    accountNumber,
    accountName: primary?.name ?? "Primary Checking",
  };
}

export async function transferToMember(
  senderId: string,
  params: {
    accountId: string;
    recipientAccountNumber: string;
    amount: number;
    note?: string;
  }
) {
  const amount = roundMoney(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid amount greater than zero");
  }

  const accountNumber = normalizeBankAccountNumber(params.recipientAccountNumber);
  if (!isValidBankAccountNumber(accountNumber)) {
    throw new Error("Enter a valid recipient account number (e.g. BR-1234567890)");
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, name: true, status: true, verificationBadge: true },
  });
  if (!sender || sender.status !== "ACTIVE") {
    throw new Error("Your account cannot send transfers right now");
  }

  const recipientAccount = await prisma.bankAccount.findUnique({
    where: { accountNumber },
    include: {
      user: {
        select: { id: true, name: true, role: true, status: true },
      },
    },
  });

  if (!recipientAccount?.user) {
    throw new Error("No active member account was found with that account number");
  }

  const recipient = recipientAccount.user;
  if (recipient.role !== "USER" || recipient.status !== "ACTIVE") {
    throw new Error("No active member account was found with that account number");
  }

  if (recipient.id === senderId) {
    throw new Error("You cannot transfer funds to your own account number");
  }

  const senderAccount = await prisma.bankAccount.findFirst({
    where: { id: params.accountId, userId: senderId },
  });
  if (!senderAccount) throw new Error("Source account not found");

  const available = await getAvailableBalance(senderId, params.accountId);
  if (available == null || available < amount) {
    throw new Error("Insufficient available balance for this transfer");
  }

  const memo = params.note?.trim();
  const senderLabel = memo
    ? `Transfer to ${recipient.name} — ${memo}`
    : `Transfer to ${recipient.name}`;
  const recipientLabel = memo
    ? `Transfer from ${sender.name} — ${memo}`
    : `Transfer from ${sender.name}`;

  const result = await runInteractiveTransaction(async (tx) => {
    const fromAccount = await tx.bankAccount.findFirst({
      where: { id: senderAccount.id, userId: senderId },
    });
    const toAccount = await findPrimaryCheckingAccount(recipient.id, tx);

    if (!fromAccount || !toAccount) throw new Error("Account not found");

    const fromBalance = Number(fromAccount.balance);
    if (fromBalance < amount) throw new Error("Insufficient balance");

    await tx.bankAccount.update({
      where: { id: fromAccount.id },
      data: { balance: roundMoney(fromBalance - amount) },
    });

    await reduceProfitBalanceOnSpend(tx, senderId, amount);

    await tx.bankAccount.update({
      where: { id: toAccount.id },
      data: { balance: roundMoney(Number(toAccount.balance) + amount) },
    });

    const debitTx = await tx.transaction.create({
      data: {
        userId: senderId,
        accountId: fromAccount.id,
        type: "TRANSFER",
        amount,
        description: senderLabel,
        status: "COMPLETED",
        counterpartyUserId: recipient.id,
      },
    });

    await tx.transaction.create({
      data: {
        userId: recipient.id,
        accountId: toAccount.id,
        type: "TRANSFER",
        amount,
        description: recipientLabel,
        status: "COMPLETED",
        counterpartyUserId: senderId,
      },
    });

    await createUserNotification(
      {
        userId: recipient.id,
        type: "MEMBER_TRANSFER",
        title: "Funds received",
        message: `${sender.name} sent you $${amount.toFixed(2)}.${memo ? ` Note: ${memo}` : ""}`,
      },
      tx
    );

    return debitTx;
  });

  return {
    amount,
    recipientAccountNumber: accountNumber,
    recipientName: recipient.name,
    referenceId: result.id,
    message: `Successfully sent $${amount.toFixed(2)} to ${recipient.name}`,
    receipt: {
      id: result.id,
      amount,
      recipientAccountNumber: accountNumber,
      recipientName: recipient.name,
      senderName: sender.name,
      senderVerificationBadge: sender.verificationBadge,
      senderAccountNumber: senderAccount.accountNumber ?? null,
      accountName: senderAccount.name,
      note: memo ?? null,
      createdAt: result.createdAt.toISOString(),
      status: "COMPLETED" as const,
    },
  };
}
