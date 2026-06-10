import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction, getClientIp } from "@/lib/admin-audit";
import { marketAssetFieldsSchema } from "@/lib/market-asset-schema";
import { mapMarketAsset } from "@/lib/market-asset-mapper";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const body = await req.json();
    const parsed = marketAssetFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.marketAsset.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const asset = await prisma.marketAsset.update({
      where: { id: params.id },
      data: parsed.data,
    });

    const action =
      parsed.data.enabled === false
        ? "MARKET_ASSET_DISABLE"
        : parsed.data.enabled === true
          ? "MARKET_ASSET_ENABLE"
          : "MARKET_ASSET_UPDATE";

    await logAdminAction(
      session.user.id,
      action,
      { symbol: asset.symbol, changes: parsed.data },
      undefined,
      getClientIp(req)
    );

    return NextResponse.json({ success: true, asset: mapMarketAsset(asset) });
  } catch (error) {
    console.error("Admin market asset PATCH error:", error);
    return NextResponse.json({ error: "Failed to update market asset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  try {
    const existing = await prisma.marketAsset.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const [holdings, orders] = await Promise.all([
      prisma.investment.count({ where: { symbol: existing.symbol } }),
      prisma.investmentOrder.count({ where: { symbol: existing.symbol } }),
    ]);

    if (holdings > 0 || orders > 0) {
      const asset = await prisma.marketAsset.update({
        where: { id: params.id },
        data: { enabled: false },
      });
      await logAdminAction(
        session.user.id,
        "MARKET_ASSET_DISABLE",
        { symbol: existing.symbol, reason: "has_investments" },
        undefined,
        getClientIp(req)
      );
      return NextResponse.json({
        success: true,
        disabled: true,
        message: "Asset has investments — disabled instead of deleted",
        asset: mapMarketAsset(asset),
      });
    }

    await prisma.marketAsset.delete({ where: { id: params.id } });
    await logAdminAction(
      session.user.id,
      "MARKET_ASSET_DELETE",
      { symbol: existing.symbol },
      undefined,
      getClientIp(req)
    );

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Admin market asset DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete market asset" }, { status: 500 });
  }
}
