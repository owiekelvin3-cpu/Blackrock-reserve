import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, dateOfBirth, password, accountType, kycIdFront, kycIdBack } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        password: hashedPassword,
        accountType,
        kycIdFront: kycIdFront || null,
        kycIdBack: kycIdBack || null,
        kycStatus: kycIdFront ? "SUBMITTED" : "PENDING",
        otpCode: otp,
        otpExpires,
      },
    });

    await prisma.bankAccount.create({
      data: {
        userId: user.id,
        name: "Primary Checking",
        type: "checking",
        balance: 0,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      message: "Account created. Please verify your email.",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
