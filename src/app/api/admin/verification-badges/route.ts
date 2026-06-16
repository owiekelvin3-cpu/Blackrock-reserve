import { NextRequest, NextResponse } from "next/server";
import type { VerificationBadgeType } from "@prisma/client";
import { getAdminSession, forbiddenResponse } from "@/lib/api-auth";
import {
  getVerificationBadgeHistory,
  getVerificationBadgeStats,
  getVerificationBadgeUsers,
  mapVerificationServiceError,
} from "@/lib/verification-badge-service";
import { isVerificationBadgeType } from "@/lib/verification-badge";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return forbiddenResponse();

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const badgeTypeParam = req.nextUrl.searchParams.get("badgeType");
  const verifiedOnly = req.nextUrl.searchParams.get("verifiedOnly") === "true";
  const historyUserId = req.nextUrl.searchParams.get("historyUserId") ?? undefined;
  const historyLimit = Math.min(Number(req.nextUrl.searchParams.get("historyLimit") ?? 50), 100);

  const badgeType =
    badgeTypeParam && isVerificationBadgeType(badgeTypeParam)
      ? (badgeTypeParam as VerificationBadgeType)
      : undefined;

  try {
    const [usersResult, historyResult, statsResult] = await Promise.allSettled([
      getVerificationBadgeUsers({ search, badgeType, verifiedOnly }),
      getVerificationBadgeHistory(historyLimit, historyUserId),
      getVerificationBadgeStats(),
    ]);

    if (usersResult.status === "rejected") {
      console.error("Admin verification users error:", usersResult.reason);
    }
    if (historyResult.status === "rejected") {
      console.error("Admin verification history error:", historyResult.reason);
    }
    if (statsResult.status === "rejected") {
      console.error("Admin verification stats error:", statsResult.reason);
    }

    if (usersResult.status === "rejected" && statsResult.status === "rejected") {
      const message = mapVerificationServiceError(usersResult.reason);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const partialErrors: string[] = [];
    if (usersResult.status === "rejected") {
      partialErrors.push(mapVerificationServiceError(usersResult.reason));
    }
    if (historyResult.status === "rejected") {
      partialErrors.push("Verification history could not be loaded.");
    }

    return NextResponse.json({
      users: usersResult.status === "fulfilled" ? usersResult.value : [],
      history: historyResult.status === "fulfilled" ? historyResult.value : [],
      stats:
        statsResult.status === "fulfilled"
          ? statsResult.value
          : { totalUsers: 0, verifiedUsers: 0 },
      partialError: partialErrors.length > 0 ? partialErrors.join(" ") : undefined,
    });
  } catch (error) {
    console.error("Admin verification badges error:", error);
    return NextResponse.json(
      { error: mapVerificationServiceError(error) },
      { status: 500 }
    );
  }
}
