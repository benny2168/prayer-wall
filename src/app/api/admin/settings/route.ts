import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AuthUser {
  id: string;
  role: string;
  isLocalAdmin?: boolean;
}

function isGlobalAdmin(session: Session & { user?: AuthUser } | null) {
  return session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin;
}

// GET /api/admin/settings — read site settings (public, used by ThemeProvider)
export async function GET() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(settings);
}

// PATCH /api/admin/settings — update site settings (admin only)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isGlobalAdmin(session as Session & { user?: AuthUser } | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { primaryColor, colorMode, homePageText } = body;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      ...(primaryColor && { primaryColor }),
      ...(colorMode && { colorMode }),
      ...(typeof homePageText === "string" && { homePageText }),
    },
    create: {
      id: "default",
      primaryColor: primaryColor ?? "#6366f1",
      colorMode: colorMode ?? "DARK",
      homePageText: homePageText ?? "A safe space to share burdens, request intercession, and lift each other up in prayer.",
    },
  });

  return NextResponse.json(updated);
}
