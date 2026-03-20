import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMemberToken, COOKIE_NAME } from "@/lib/member-session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const email = token ? await verifyMemberToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prayers = await prisma.prayer.findMany({
    where: { email, isArchived: false },
    select: {
      id: true,
      text: true,
      name: true,
      isPublic: true,
      createdAt: true,
      organization: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prayers });
}
