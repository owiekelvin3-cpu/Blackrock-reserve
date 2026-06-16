import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminCardRequests } from "@/lib/physical-cards";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const status = request.nextUrl.searchParams.get("status") ?? "all";
    const requests = await getAdminCardRequests(status);
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Admin card requests GET error:", error);
    return NextResponse.json({ error: "Failed to load card requests" }, { status: 500 });
  }
}
