import { NextResponse } from "next/server";
import { getSessionUserId, unauthorizedResponse } from "@/lib/api-auth";
import { memberTransferSchema } from "@/lib/validations";
import { transferToMember } from "@/lib/member-transfer-service";
import { requireTransactionPin } from "@/lib/transaction-pin";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = memberTransferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid transfer request" },
        { status: 400 }
      );
    }

    const pinError = await requireTransactionPin(userId, parsed.data.transactionPin);
    if (pinError) return pinError;

    const transfer = await transferToMember(userId, parsed.data);
    return NextResponse.json({ ok: true, ...transfer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
