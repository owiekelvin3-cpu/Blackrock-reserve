import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getClientIp } from "@/lib/admin-audit";
import { captureUserLocationAsync } from "@/lib/user-location";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  const ip = getClientIp(req);
  captureUserLocationAsync(userId, ip);

  return NextResponse.json({ ok: true });
}
