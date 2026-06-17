import { prisma } from "@/lib/prisma";
import { getAccounts } from "@/lib/dashboard-data";

/** Capital currently deployed in open holdings (cost basis), excluding sold positions. */
export async function getInvestedBalance(userId: string): Promise<number> {
  const holdings = await prisma.investment.findMany({
    where: { userId },
    select: { shares: true, avgPrice: true },
  });

  const total = holdings.reduce((sum, holding) => {
    const shares = Number(holding.shares);
    if (shares <= 0) return sum;
    return sum + shares * Number(holding.avgPrice);
  }, 0);

  return Math.round(total * 100) / 100;
}

export async function getProfitBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profitBalance: true },
  });
  return Math.round(Number(user?.profitBalance ?? 0) * 100) / 100;
}

/** Sum of realized P&L from completed sell orders. */
export async function getTradingRealizedProfit(userId: string): Promise<number> {
  const result = await prisma.investmentOrder.aggregate({
    where: { userId, side: "SELL", status: "COMPLETED" },
    _sum: { realizedPnl: true },
  });
  return Math.round(Number(result._sum.realizedPnl ?? 0) * 100) / 100;
}

export async function getUserBalanceSummary(userId: string) {
  const [accounts, investedBalance, profitBalance] = await Promise.all([
    getAccounts(userId),
    getInvestedBalance(userId),
    getProfitBalance(userId),
  ]);

  const mainBalance = Math.round(accounts.reduce((sum, a) => sum + a.balance, 0) * 100) / 100;
  const primaryAccount =
    accounts.find((a) => a.type === "checking") ?? accounts[0] ?? null;

  return {
    mainBalance,
    investedBalance,
    profitBalance,
    accounts,
    primaryAccountId: primaryAccount?.id ?? null,
  };
}
