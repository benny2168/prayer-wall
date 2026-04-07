import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ThemeTab from "../settings/ThemeTab";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function ThemePage() {
  const session = await getServerSession(authOptions) as Session & { user?: { role: string, isLocalAdmin: boolean } };
  const isGlobalAdmin =
    session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin;

  if (!isGlobalAdmin) redirect("/admin");

  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Global Branding</h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">Customize the identity, colors, and landing experience of the Prayer Wall platform.</p>
      </div>

      <div className="glass-panel p-8">
        <ThemeTab
          initial={{
            primaryColor: siteSettings.primaryColor,
            colorMode: siteSettings.colorMode,
            lightLogoUrl: siteSettings.lightLogoUrl,
            darkLogoUrl: siteSettings.darkLogoUrl,
            homePageText: siteSettings.homePageText,
          }}
        />
      </div>
    </div>
  );
}
