import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getLoanDashboardData } from "@/lib/loan-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const data = await getLoanDashboardData(userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Loans dashboard error:", error);
    return NextResponse.json({ error: "Failed to load loans" }, { status: 500 });
  }
}
