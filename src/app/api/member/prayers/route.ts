import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prayers = await prisma.prayer.findMany({
    where: { email: { equals: email, mode: 'insensitive' }, isArchived: false },
    select: {
      id: true,
      text: true,
      name: true,
      isPublic: true,
      prayer_count: true,
      createdAt: true,
      organization: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ prayers });
}
