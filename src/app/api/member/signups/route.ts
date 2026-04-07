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

  const signups = await prisma.prayerChainSignup.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: {
      prayerChain: {
        select: {
          id: true,
          title: true,
          start_time: true,
          end_time: true,
          organization: {
            select: { name: true, slug: true },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ email, signups });
}
