import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembersTab from "./MembersTab";
import ThemeTab from "./ThemeTab";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions) as Session & { user?: { role: string, isLocalAdmin: boolean } };
  const isGlobalAdmin =
    session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin;

  if (!isGlobalAdmin) redirect("/admin");

  const { tab = "members" } = await searchParams;

  const [users, organizations, siteSettings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, image: true, role: true,
        organizations: {
          select: {
            id: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
  ]);

  const tabs = [
    { id: "members", label: "👥 Members" },
    { id: "theme", label: "🎨 Theme" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[--color-text-base]">Settings</h1>
        <p className="text-[--color-text-muted] mt-1">Manage system configuration and user access.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[--color-bg-panel] p-1 rounded-xl border border-[--color-border-base] w-fit">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`/admin/settings?tab=${t.id}`}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-theme-600 text-white shadow"
                : "text-[--color-text-muted] hover:text-[--color-text-base] hover:bg-[--color-bg-base]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="glass-card p-6">
        {tab === "members" && (
          <MembersTab users={users as any} organizations={organizations} />
        )}
        {tab === "theme" && (
          <ThemeTab
            initial={{
              primaryColor: siteSettings.primaryColor,
              colorMode: siteSettings.colorMode,
              lightLogoUrl: siteSettings.lightLogoUrl,
              darkLogoUrl: siteSettings.darkLogoUrl,
              homePageText: siteSettings.homePageText,
            }}
          />
        )}
      </div>
    </div>
  );
}
