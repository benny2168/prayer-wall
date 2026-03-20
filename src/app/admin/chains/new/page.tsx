import { prisma } from "@/lib/prisma";
import { createPrayerChain } from "@/app/admin/actions";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function NewChainPage() {
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

  const organizations = await prisma.organization.findMany({
    where: isGlobalAdmin ? undefined : { id: { in: userOrgIds } },
    orderBy: { name: "asc" }
  });

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <Link href="/admin/chains" className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors text-sm mb-4 inline-block">
          ← Back to Prayer Chains
        </Link>
        <h1 className="text-3xl font-bold text-[--color-text-base]">Create New Prayer Chain</h1>
        <p className="text-[--color-text-muted] mt-2">Configure a new continuous prayer initiative constraint by dates to ensure continuous coverage.</p>
      </div>

      {/* @ts-expect-error React form types don't natively support returning custom objects from actions yet */}
      <form action={createPrayerChain} encType="multipart/form-data" className="space-y-8">
        
        {organizations.length === 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm mb-6">
            You must create an Organization first before you can start a prayer chain.
          </div>
        )}

        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-xl font-semibold text-[--color-text-base] border-b border-[--color-border-base] pb-3">General Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm text-[--color-text-muted] mb-1">Chain Title</label>
              <input type="text" name="title" required placeholder="e.g. 24/7 Lent Prayer Chain" className="input-field" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[--color-text-muted] mb-1">Public Description (Optional)</label>
              <textarea 
                name="description" 
                className="input-field min-h-[100px]" 
                placeholder="A short description of this prayer chain that people will see when they sign up..." 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-[--color-text-muted] mb-1">Thumbnail Image (Optional)</label>
              <input 
                type="file" 
                name="thumbnail" 
                accept="image/*" 
                className="input-field py-2 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
              />
            </div>

            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Organization</label>
              <select name="orgId" required className="input-field appearance-none bg-[--color-bg-panel]">
                {organizations.map((org: any) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Status</label>
              <select name="isActive" className="input-field appearance-none bg-[--color-bg-panel]">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold text-[--color-text-base] border-b border-[--color-border-base] pb-2">Schedule & Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Start Date</label>
              <input type="date" name="start_time" required className="input-field [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">End Date</label>
              <input type="date" name="end_time" required className="input-field [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Daily Start Time (24h)</label>
              <input type="time" name="daily_start" required defaultValue="00:00" className="input-field [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Daily End Time (24h)</label>
              <input type="time" name="daily_end" required defaultValue="23:59" className="input-field [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Block Duration (minutes)</label>
              <select name="block_duration_mins" defaultValue="60" className="input-field appearance-none bg-[--color-bg-panel]">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 Hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[--color-text-muted] mb-1">Max People per Block</label>
              <input type="number" name="max_people_per_block" required min="1" defaultValue="1" className="input-field" />
            </div>
          </div>
          <div className="pt-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input type="checkbox" name="isPublic" defaultChecked className="rounded border-[--color-border-base] bg-[--color-bg-panel]/50 text-primary w-5 h-5" />
              <span className="text-[--color-text-base] group-hover:text-primary transition-colors font-medium">Show on organization page</span>
            </label>
            <p className="text-xs text-[--color-text-muted] mt-1 ml-8">If disabled, this prayer chain will only be accessible via a direct private link.</p>
          </div>
        </div>

        <div className="pt-6 flex justify-end items-center space-x-4 border-t border-[--color-border-base]">
          <Link href="/admin/chains" className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={organizations.length === 0}>
            Deploy Prayer Chain
          </button>
        </div>
      </form>
    </div>
  );
}
