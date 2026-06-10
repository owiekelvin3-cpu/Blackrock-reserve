import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminMarketAssets, getNextMarketAssetSortOrder } from "@/lib/admin-market";
import { prisma } from "@/lib/prisma";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { createMarketAssetSchema } from "@/lib/market-asset-schema";
import { mapMarketAsset } from "@/lib/market-asset-mapper";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const assets = await getAdminMarketAssets();
    return NextResponse.json({ assets });
  } catch (error) {
    console.error("Admin market assets GET error:", error);
    return NextResponse.json({ error: "Failed to load market assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = createMarketAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;
    const symbol = data.symbol.toUpperCase();
    const existing = await prisma.marketAsset.findUnique({ where: { symbol } });
    if (existing) {
      return NextResponse.json({ error: "Symbol already exists" }, { status: 409 });
    }

    const sortOrder = data.sortOrder ?? (await getNextMarketAssetSortOrder());

    const asset = await prisma.marketAsset.create({
      data: {
        symbol,
        name: data.name,
        sector: data.sector,
        description: data.description,
        logoDomain: data.logoDomain ?? null,
        logoUrl: data.logoUrl ?? null,
        price: data.price,
        changePercent: data.changePercent ?? 0,
        minInvestment: data.minInvestment ?? 100,
        riskRating: data.riskRating ?? "Medium",
        expectedReturnPercent: data.expectedReturnPercent ?? 8,
        growthRate: data.growthRate ?? 0,
        return7d: data.return7d ?? 0,
        return14d: data.return14d ?? 0,
        return30d: data.return30d ?? 0,
        return90d: data.return90d ?? 0,
        return1y: data.return1y ?? 0,
        returnWeekly: data.returnWeekly ?? 0,
        returnMonthly: data.returnMonthly ?? 0,
        returnYearly: data.returnYearly ?? 0,
        customReturnLabel: data.customReturnLabel ?? null,
        customReturnPercent: data.customReturnPercent ?? null,
        marketCapRank: data.marketCapRank ?? 999,
        popularity: data.popularity ?? 0,
        sortOrder,
        isFeatured: data.isFeatured ?? false,
        isPinned: data.isPinned ?? false,
        enabled: data.enabled ?? true,
      },
    });

    await logAdminAction(
      session.user.id,
      "MARKET_ASSET_CREATE",
      { symbol, name: data.name },
      undefined,
      getClientIp(req)
    );

    return NextResponse.json({ asset: mapMarketAsset(asset) }, { status: 201 });
  } catch (error) {
    console.error("Admin market assets POST error:", error);
    return NextResponse.json({ error: "Failed to create market asset" }, { status: 500 });
  }
}
