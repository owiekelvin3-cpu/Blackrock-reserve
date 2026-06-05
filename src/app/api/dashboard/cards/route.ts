import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { getCards } from "@/lib/dashboard-data";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const cards = await getCards(userId);
    return NextResponse.json({
      cards: cards.map((c) => ({
        id: c.id,
        name: `${c.brand.charAt(0).toUpperCase() + c.brand.slice(1)} Card`,
        last4: c.last4,
        brand: c.brand,
        status: c.status,
      })),
    });
  } catch (error) {
    console.error("Cards fetch error:", error);
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 });
  }
}
