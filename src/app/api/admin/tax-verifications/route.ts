import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminTaxVerifications } from "@/lib/admin-loan-data";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const verifications = await getAdminTaxVerifications({ status, search });
    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Admin tax verifications error:", error);
    return NextResponse.json({ error: "Failed to load verifications" }, { status: 500 });
  }
}
