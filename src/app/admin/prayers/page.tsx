import { prisma } from "@/lib/prisma";
import PrayerAdminList from "./PrayerAdminList";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function PrayersAdminPage({ searchParams }: { searchParams: { tab?: string } | Promise<{ tab?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isGlobalAdmin = user?.role === "GLOBAL_ADMIN";

  let userOrgIds: string[] = [];
  if (user && !isGlobalAdmin) {
    const roles = await prisma.organizationRole.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    userOrgIds = roles.map((r: { organizationId: string }) => r.organizationId);
  }

  const isArchived = resolvedSearchParams?.tab === "archived";

  let prayers: any[] = [];
  
  if (isGlobalAdmin) {
    prayers = await prisma.prayer.findMany({
      where: { isArchived },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (userOrgIds.length > 0) {
    prayers = await prisma.prayer.findMany({
      where: { 
        isArchived,
        organizationId: { in: userOrgIds }
      },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Intercessor Requests</h1>
          <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">Review, moderate, and archive shared intercession requests across all organizations.</p>
        </div>
        
        <div className="flex bg-[--color-bg-panel] rounded-lg p-1 border border-[--color-border-base]">
          <a 
            href="/admin/prayers" 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!isArchived ? "bg-[--color-border-base] text-[--color-text-base] shadow" : "text-[--color-text-muted] hover:text-[--color-text-base]"}`}
          >
            Active
          </a>
          <a 
            href="/admin/prayers?tab=archived" 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isArchived ? "bg-[--color-border-base] text-[--color-text-base] shadow" : "text-[--color-text-muted] hover:text-[--color-text-base]"}`}
          >
            Archived
          </a>
        </div>
      </div>

      {prayers.length === 0 ? (
        <div className="text-center py-20 text-[--color-text-muted] bg-[--color-bg-panel]/40 rounded-xl border border-dashed border-[--color-border-base]">
          No prayers found in this category.
        </div>
      ) : (
        <PrayerAdminList initialPrayers={prayers} isArchivedView={isArchived} />
      )}
    </div>
  );
}
