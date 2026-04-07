import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ prayerId: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prayerId } = await params;
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Prayer text is required." }, { status: 400 });
  }

  // Verify ownership before editing (case-insensitive)
  const prayer = await prisma.prayer.findFirst({ 
    where: { 
      id: prayerId,
      email: { equals: email, mode: 'insensitive' }
    } 
  });
  
  if (!prayer) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const updated = await prisma.prayer.update({
    where: { id: prayerId },
    data: { text: text.trim() },
  });

  return NextResponse.json({ success: true, prayer: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ prayerId: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prayerId } = await params;

  // Verify ownership before deleting (case-insensitive)
  const prayer = await prisma.prayer.findFirst({ 
    where: { 
      id: prayerId, 
      email: { equals: email, mode: 'insensitive' }
    } 
  });
  
  if (!prayer) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  // Soft-delete by archiving
  await prisma.prayer.update({ where: { id: prayerId }, data: { isArchived: true } });

  return NextResponse.json({ success: true });
}
