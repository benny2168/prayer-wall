import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ signupId: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { signupId } = await params;

  // Verify ownership before deleting (case-insensitive)
  const signup = await prisma.prayerChainSignup.findFirst({
    where: { 
      id: signupId,
      email: { equals: email, mode: 'insensitive' }
    },
  });

  if (!signup) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  await prisma.prayerChainSignup.delete({ where: { id: signupId } });

  return NextResponse.json({ success: true });
}
