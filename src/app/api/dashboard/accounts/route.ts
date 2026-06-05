import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getAccounts } from "@/lib/dashboard-data";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const accounts = await getAccounts(userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Accounts fetch error:", error);
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
  }
}
