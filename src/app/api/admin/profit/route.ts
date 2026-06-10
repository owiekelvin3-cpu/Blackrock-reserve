import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getClientIp } from "@/lib/admin-audit";
import { addUserProfit, removeUserProfit, getProfitAdjustments } from "@/lib/profit-service";
import { getInvestedBalance, getProfitBalance } from "@/lib/user-balances";
import { getAccounts } from "@/lib/dashboard-data";
import { prisma } from "@/lib/prisma";
import { verifiedCustomerWhere } from "@/lib/customer-auth";

const profitSchema = z.object({
  action: z.enum(["add", "remove"]),
  userId: z.string().min(1),
  amount: z.coerce.number().positive().max(100_000_000),
  reason: z.string().min(3).max(500),
  accountId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    const q = req.nextUrl.searchParams.get("q")?.trim();

    if (q) {
      const users = await prisma.user.findMany({
        where: {
          ...verifiedCustomerWhere,
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          profitBalance: true,
          status: true,
        },
        take: 20,
        orderBy: { name: "asc" },
      });

      const enriched = await Promise.all(
        users.map(async (u) => {
          const [investedBalance, accounts] = await Promise.all([
            getInvestedBalance(u.id),
            getAccounts(u.id),
          ]);
          const mainBalance = accounts.reduce((s, a) => s + a.balance, 0);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            status: u.status,
            profitBalance: Number(u.profitBalance),
            investedBalance,
            mainBalance,
            accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
          };
        })
      );

      return NextResponse.json({ users: enriched });
    }

    const records = await getProfitAdjustments(100, userId);
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Admin profit GET error:", error);
    return NextResponse.json({ error: "Failed to load profit data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = profitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const ip = getClientIp(req);
    const payload = {
      userId: parsed.data.userId,
      adminId: session.user.id,
      amount: Math.round(parsed.data.amount * 100) / 100,
      reason: parsed.data.reason,
      accountId: parsed.data.accountId,
      ipAddress: ip,
    };

    const result =
      parsed.data.action === "add"
        ? await addUserProfit(payload)
        : await removeUserProfit(payload);

    const [profitBalance, investedBalance, accounts] = await Promise.all([
      getProfitBalance(parsed.data.userId),
      getInvestedBalance(parsed.data.userId),
      getAccounts(parsed.data.userId),
    ]);

    return NextResponse.json({
      success: true,
      ...result,
      profitBalance,
      investedBalance,
      mainBalance: accounts.reduce((s, a) => s + a.balance, 0),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profit operation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
