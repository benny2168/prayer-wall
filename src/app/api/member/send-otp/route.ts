import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMemberOtp } from "@/lib/email";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email has any signups at all (optional guard — remove if you want open access)
    const hasSignups = await prisma.prayerChainSignup.findFirst({
      where: { email: normalizedEmail },
    });
    if (!hasSignups) {
      // Silently succeed to avoid email enumeration — user sees "check your email" regardless
      return NextResponse.json({ success: true });
    }

    // Delete old OTPs for this email
    await prisma.memberOtp.deleteMany({ where: { email: normalizedEmail } });

    // Generate and store new code (plain — it's a short-lived 6-digit code, not a password)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.memberOtp.create({
      data: { email: normalizedEmail, code, expiresAt },
    });

    await sendMemberOtp(normalizedEmail, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Failed to send code. Please try again." }, { status: 500 });
  }
}
