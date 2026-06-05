import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getAccounts, getTransactions } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const [accounts, transfers] = await Promise.all([
      getAccounts(userId),
      getTransactions(userId, "TRANSFER", 10),
    ]);

    const recent = transfers.map((t) => ({
      id: t.id,
      to: t.description,
      amount: Math.abs(Number(t.amount)),
      date: formatRelativeDate(new Date(t.createdAt)),
      status: t.status.toLowerCase(),
    }));

    return NextResponse.json({ accounts, recent });
  } catch (error) {
    console.error("Transfers fetch error:", error);
    return NextResponse.json({ error: "Failed to load transfers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const { accountId, recipient, amount, note } = await req.json();

    if (!accountId || !recipient || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid transfer details" }, { status: 400 });
    }

    const account = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (Number(account.balance) < Number(amount)) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    const [, transaction] = await prisma.$transaction([
      prisma.bankAccount.update({
        where: { id: accountId },
        data: { balance: { decrement: Number(amount) } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          accountId,
          type: "TRANSFER",
          amount: Number(amount),
          description: note ? `Transfer to ${recipient} — ${note}` : `Transfer to ${recipient}`,
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({ transaction, message: "Transfer completed" });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
  }
}

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
