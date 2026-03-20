import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const orgCount = await prisma.organization.count();
  const prayerCount = await prisma.prayer.count({ where: { isArchived: false } });
  const chainCount = await prisma.prayerChain.count({ where: { isActive: true } });
  const signupCount = await prisma.prayerChainSignup.count();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-[--color-text-base] mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1">Organizations</p>
          <p className="text-4xl font-bold text-[--color-text-base]">{orgCount}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1">Active Prayers</p>
          <p className="text-4xl font-bold text-theme-400">{prayerCount}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1">Active Chains</p>
          <p className="text-4xl font-bold text-theme-400">{chainCount}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1">Chain Signups</p>
          <p className="text-4xl font-bold text-emerald-400">{signupCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-[--color-text-base] mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/organizations/new" className="block w-full p-4 bg-[--color-bg-panel]/50 hover:bg-[--color-border-base]/50 rounded-xl transition-colors border border-[--color-border-base] font-medium">
              + Register New Organization
            </Link>
            <Link href="/admin/chains/new" className="block w-full p-4 bg-[--color-bg-panel]/50 hover:bg-[--color-border-base]/50 rounded-xl transition-colors border border-[--color-border-base] font-medium">
              + Start Prayer Chain
            </Link>
          </div>
        </div>
        
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-[--color-text-base] mb-4">Recent Activity</h2>
          <p className="text-[--color-text-muted] italic">Logging system not fully implemented.</p>
        </div>
      </div>
    </div>
  );
}
