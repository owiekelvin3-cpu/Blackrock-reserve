import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { lookupMemberTransferRecipient } from "@/lib/member-transfer-service";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  const accountNumber = new URL(request.url).searchParams.get("accountNumber")?.trim();
  if (!accountNumber) {
    return NextResponse.json({ error: "Account number is required" }, { status: 400 });
  }

  const result = await lookupMemberTransferRecipient(userId, accountNumber);

  if (!result.found) {
    const message =
      result.reason === "self"
        ? "You cannot transfer funds to your own account"
        : result.reason === "invalid"
          ? "Enter a valid account number (e.g. BR-1234567890)"
          : "No active member account was found with that account number";
    return NextResponse.json({ found: false, error: message }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    name: result.name,
    accountNumber: result.accountNumber,
    accountName: result.accountName,
  });
}
