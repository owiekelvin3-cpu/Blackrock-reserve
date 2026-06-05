import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: otp,
          otpExpires: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Password reset OTP for ${email}: ${otp}`);
      }
    }

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
