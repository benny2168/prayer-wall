import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMemberToken, COOKIE_NAME } from "@/lib/member-session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ signupId: string }> }
) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const email = token ? await verifyMemberToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { signupId } = await params;

  // Verify ownership before deleting
  const signup = await prisma.prayerChainSignup.findUnique({
    where: { id: signupId },
  });

  if (!signup || signup.email !== email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.prayerChainSignup.delete({ where: { id: signupId } });

  return NextResponse.json({ success: true });
}
