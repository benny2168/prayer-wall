import { prisma } from "@/lib/prisma";
import { createOrganization } from "@/app/admin/actions";
import OrganizationCard from "./OrganizationCard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isGlobalAdmin = user?.role === "GLOBAL_ADMIN";

  // Fetch the user's explicit organizational roles if they aren't a global admin
  let userOrgIds: string[] = [];
  if (user && !isGlobalAdmin) {
    const roles = await prisma.organizationRole.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    userOrgIds = roles.map((r: { organizationId: string }) => r.organizationId);
  }

  // Regular users only see the organizations they are admins of.
  // Global admins see everything.
  let organizations: any[] = [];
  
  if (isGlobalAdmin) {
    organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { prayers: true, chains: true } },
      },
    });
  } else if (userOrgIds.length > 0) {
    organizations = await prisma.organization.findMany({
      where: { id: { in: userOrgIds } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { prayers: true, chains: true } },
      },
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Manage Organizations</h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">Oversee church branches, fellowships, and ministry groups across the Prayer Wall ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {organizations.map((org: any) => (
            <OrganizationCard 
              key={org.id} 
              org={org} 
              isAdmin={isGlobalAdmin || userOrgIds.includes(org.id)} 
            />
          ))}

          {organizations.length === 0 && (
            <div className="text-center py-12 text-[--color-text-muted] bg-[--color-bg-panel]/40 rounded-xl border border-dashed border-[--color-border-base]">
              No organizations found.
            </div>
          )}
        </div>

        {isGlobalAdmin && (
          <div>
            {/* @ts-expect-error React form types don't officially support returning objects from server actions inline yet */}
            <form action={createOrganization} className="glass-panel p-6 sticky top-8">
              <h3 className="font-bold text-[--color-text-base] text-lg mb-4">Add Organization</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[--color-text-muted] mb-1">Name</label>
                  <input type="text" name="name" required className="input-field py-2" placeholder="e.g. First Church" />
                </div>
                <div>
                  <label className="block text-sm text-[--color-text-muted] mb-1 uppercase tracking-widest text-[10px]">Timezone</label>
                  <select name="timezone" className="input-field py-2 text-sm" defaultValue="America/New_York">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full mt-2">Create Organization</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
