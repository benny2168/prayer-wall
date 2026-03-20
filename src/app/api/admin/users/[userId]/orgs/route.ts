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

// POST /api/admin/users/[userId]/orgs — grant org admin access
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isGlobalAdmin(session as Session & { user?: AuthUser } | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { organizationId } = await req.json();

  const role = await prisma.organizationRole.create({
    data: { userId, organizationId },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(role);
}

// DELETE /api/admin/users/[userId]/orgs — revoke org admin access
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!isGlobalAdmin(session as Session & { user?: AuthUser } | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const { organizationId } = await req.json();

  await prisma.organizationRole.deleteMany({
    where: { userId, organizationId },
  });

  return NextResponse.json({ success: true });
}
