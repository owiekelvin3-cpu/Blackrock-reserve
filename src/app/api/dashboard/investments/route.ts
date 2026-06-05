import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getInvestments } from "@/lib/dashboard-data";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const holdings = await getInvestments(userId);
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    return NextResponse.json({ holdings, totalValue });
  } catch (error) {
    console.error("Investments fetch error:", error);
    return NextResponse.json({ error: "Failed to load investments" }, { status: 500 });
  }
}
