import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deletePrayerChain } from "@/app/admin/actions";
import DeleteButton from "@/components/DeleteButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function AdminChainsPage() {
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

  let chains: any[] = [];
  
  if (isGlobalAdmin) {
    chains = await prisma.prayerChain.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organization: true,
        _count: { select: { signups: true } }
      }
    });
  } else if (userOrgIds.length > 0) {
    chains = await prisma.prayerChain.findMany({
      where: { organizationId: { in: userOrgIds } },
      orderBy: { createdAt: "desc" },
      include: {
        organization: true,
        _count: { select: { signups: true } }
      }
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[--color-text-base]">Prayer Chains</h1>
        
        {(isGlobalAdmin || userOrgIds.length > 0) && (
          <Link href="/admin/chains/new">
            <button className="btn-primary flex items-center space-x-2">
              <span>+</span>
              <span>New Chain</span>
            </button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {chains.map((chain: any) => (
          <div key={chain.id} className="glass-panel p-6 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${chain.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-[--color-text-muted] border border-slate-500/30'}`}>
                  {chain.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-[--color-text-muted] text-sm font-medium">{chain.organization.name}</span>
              </div>
              <h3 className="text-xl font-bold text-[--color-text-base] mb-2">{chain.title}</h3>
              <div className="flex flex-wrap text-sm text-[--color-text-muted] gap-4">
                <p>🗓️ {new Date(chain.start_time).toLocaleDateString()} - {new Date(chain.end_time).toLocaleDateString()}</p>
                <p>⏰ {chain.daily_start} to {chain.daily_end} (Daily)</p>
                <p>⏱️ {chain.block_duration_mins} min blocks</p>
              </div>
              <div className="mt-3">
                <a href={`/${chain.organization.slug}/chain`} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-400 hover:text-indigo-300 transition-colors flex items-center w-fit">
                  View Public Prayer Chain <span className="ml-1 text-[10px]">↗</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex md:flex-col items-center justify-between bg-[--color-bg-panel]/50 p-4 rounded-xl border border-[--color-border-base]/50 text-center min-w-[120px]">
                <span className="text-3xl font-bold text-theme-400">{chain._count.signups}</span>
                <span className="text-[--color-text-muted] text-sm font-medium">Total Signups</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Link href={`/admin/chains/${chain.id}`}>
                  <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>Edit & Manage</span>
                  </button>
                </Link>
                <DeleteButton id={chain.id} action={deletePrayerChain} itemType="prayer chain" />
              </div>
            </div>
          </div>
        ))}

        {chains.length === 0 && (
          <div className="text-center py-20 text-[--color-text-muted] bg-[--color-bg-panel]/40 rounded-xl border border-dashed border-[--color-border-base]">
            No prayer chains have been created yet.
          </div>
        )}
      </div>
    </div>
  );
}
