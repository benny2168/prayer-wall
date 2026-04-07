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
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Prayer Chain Ecosystem</h1>
          <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">Configure 24/7 prayer coverage, manage intercessor schedules, and monitor engagement.</p>
        </div>
        
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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${chain.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-[--color-text-muted] border border-slate-500/30'}`}>
                  {chain.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-[--color-text-muted] text-xs font-bold uppercase tracking-widest bg-[--color-bg-panel]/50 px-2 py-0.5 rounded border border-[--color-border-base]">{(chain as any).organization.name}</span>
              </div>
              <h3 className="text-xl font-bold text-[--color-text-base] mb-3">{chain.title}</h3>
              <div className="flex flex-wrap text-[11px] font-bold uppercase tracking-wider text-[--color-text-muted] gap-y-2 gap-x-4">
                <p className="flex items-center gap-1.5 bg-[--color-bg-panel]/30 px-2 py-1 rounded-md"><span>🗓️</span> {new Date(chain.start_time).toLocaleDateString()} - {new Date(chain.end_time).toLocaleDateString()}</p>
                <p className="flex items-center gap-1.5 bg-[--color-bg-panel]/30 px-2 py-1 rounded-md"><span>⏰</span> {chain.daily_start} to {chain.daily_end}</p>
                <p className="flex items-center gap-1.5 bg-[--color-bg-panel]/30 px-2 py-1 rounded-md"><span>⏱️</span> {chain.block_duration_mins}m blocks</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/chains/${chain.id}`}>
                  <button className="btn-secondary py-1 px-3 text-[10px] flex items-center gap-2">
                    ⚙️ Manage Schedule
                  </button>
                </Link>
                <a 
                  href={`/${chain.organization.slug}/chain`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-secondary py-1 px-3 text-[10px] border-theme-500/30 text-theme-500 hover:bg-theme-500/5 transition-all flex items-center gap-2"
                >
                  <span className="text-[10px]">↗</span> View Live Chain
                </a>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col items-center gap-4">
              <div className="flex flex-col items-center justify-center bg-[--color-bg-panel]/50 p-4 rounded-xl border border-[--color-border-base]/50 text-center min-w-[120px] shadow-sm">
                <span className="text-3xl font-bold text-theme-400">{(chain as any)._count.signups}</span>
                <span className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-widest mt-1">Total Signups</span>
              </div>
              <div className="self-center">
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
