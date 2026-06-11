import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getActivityById } from "@/lib/activity-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  try {
    const activity = await getActivityById(userId, id);
    if (!activity) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activity detail error:", error);
    return NextResponse.json({ error: "Failed to load transaction" }, { status: 500 });
  }
}
