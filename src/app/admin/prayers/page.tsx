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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[--color-text-base]">Prayer Management</h1>
        
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
