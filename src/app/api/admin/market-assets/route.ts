import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { getAdminMarketAssets, getNextMarketAssetSortOrder } from "@/lib/admin-market";
import { prisma } from "@/lib/prisma";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import {
  createMarketAssetSchema,
  buildMarketAssetCreateData,
  formatZodError,
} from "@/lib/market-asset-schema";
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
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const data = parsed.data;
    const symbol = data.symbol;
    const existing = await prisma.marketAsset.findUnique({ where: { symbol } });
    if (existing) {
      return NextResponse.json({ error: "Symbol already exists" }, { status: 409 });
    }

    const sortOrder = data.sortOrder ?? (await getNextMarketAssetSortOrder());
    const asset = await prisma.marketAsset.create({
      data: buildMarketAssetCreateData(data, sortOrder),
    });

    await logAdminAction(
      session.user.id,
      "MARKET_ASSET_CREATE",
      { symbol, name: data.name ?? symbol },
      undefined,
      getClientIp(req)
    );

    return NextResponse.json({ asset: mapMarketAsset(asset) }, { status: 201 });
  } catch (error) {
    console.error("Admin market assets POST error:", error);
    return NextResponse.json({ error: "Failed to create market asset" }, { status: 500 });
  }
}
