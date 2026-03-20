import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMemberToken, COOKIE_NAME } from "@/lib/member-session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ prayerId: string }> }
) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const email = token ? await verifyMemberToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prayerId } = await params;
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Prayer text is required." }, { status: 400 });
  }

  // Verify ownership before editing
  const prayer = await prisma.prayer.findUnique({ where: { id: prayerId } });
  if (!prayer || prayer.email !== email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const email = token ? await verifyMemberToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prayerId } = await params;

  const prayer = await prisma.prayer.findUnique({ where: { id: prayerId } });
  if (!prayer || prayer.email !== email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft-delete by archiving
  await prisma.prayer.update({ where: { id: prayerId }, data: { isArchived: true } });

  return NextResponse.json({ success: true });
}
