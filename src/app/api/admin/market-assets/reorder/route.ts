import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { reorderMarketAssetsSchema, formatZodError } from "@/lib/market-asset-schema";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = reorderMarketAssetsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { orderedIds } = parsed.data;

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.marketAsset.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    await logAdminAction(
      session.user.id,
      "MARKET_ASSET_REORDER",
      { count: orderedIds.length },
      undefined,
      getClientIp(req)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin market assets reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder assets" }, { status: 500 });
  }
}
