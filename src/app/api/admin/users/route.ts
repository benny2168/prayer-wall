import { getServerSession, Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AuthUser {
  id: string;
  role?: string;
  isLocalAdmin?: boolean;
}

function isGlobalAdmin(session: Session & { user?: AuthUser } | null) {
  return session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin;
}

// GET /api/admin/users — list all users with roles and org memberships
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isGlobalAdmin(session as Session & { user?: AuthUser } | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      organizations: {
        select: {
          id: true,
          organization: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

// PATCH /api/admin/users — toggle global role for a user
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isGlobalAdmin(session as Session & { user?: AuthUser } | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !["USER", "GLOBAL_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, role: true },
  });

  return NextResponse.json(updated);
}
