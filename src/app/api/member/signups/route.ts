import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMemberToken, COOKIE_NAME } from "@/lib/member-session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const email = token ? await verifyMemberToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signups = await prisma.prayerChainSignup.findMany({
    where: { email },
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
