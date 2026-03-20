import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMemberToken, COOKIE_NAME } from "@/lib/member-session";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otp = await prisma.memberOtp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "No code found. Please request a new one." }, { status: 400 });
    }

    if (otp.expiresAt < new Date()) {
      await prisma.memberOtp.delete({ where: { id: otp.id } });
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    if (otp.code !== code.trim()) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Success — delete OTP and issue session cookie
    await prisma.memberOtp.delete({ where: { id: otp.id } });

    const token = await createMemberToken(normalizedEmail);

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
