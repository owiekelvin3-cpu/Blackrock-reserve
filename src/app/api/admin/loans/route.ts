import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminLoanApplications } from "@/lib/admin-loan-data";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const applications = await getAdminLoanApplications({ status, search });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Admin loans error:", error);
    return NextResponse.json({ error: "Failed to load loan applications" }, { status: 500 });
  }
}
