import { NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminWithdrawalChargePayments } from "@/lib/admin-data";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const payments = await getAdminWithdrawalChargePayments();
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Admin charge payments GET error:", error);
    return NextResponse.json({ error: "Failed to load charge payments" }, { status: 500 });
  }
}
