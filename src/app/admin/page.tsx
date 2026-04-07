import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ActivityLogClient from "@/components/ActivityLogClient";
import { PlusCircle, CalendarPlus, Database } from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboard() {
  const [orgCount, prayerCount, chainCount, signupCount, recentActivities] = await Promise.all([
    prisma.organization.count(),
    prisma.prayer.count({ where: { isArchived: false } }),
    prisma.prayerChain.count({ where: { isActive: true } }),
    prisma.prayerChainSignup.count(),
    prisma.activityLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        organization: { select: { name: true } }
      }
    })
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Dashboard Overview</h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">A specialized view of your intercession ecosystem and organizational health.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1 uppercase tracking-widest text-[10px]">Organizations</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-[--color-text-base]">{orgCount}</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1 uppercase tracking-widest text-[10px]">Active Prayers</p>
          <p className="text-4xl font-bold text-theme-500">{prayerCount}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1 uppercase tracking-widest text-[10px]">Active Chains</p>
          <p className="text-4xl font-bold text-theme-500">{chainCount}</p>
        </div>
        
        <div className="glass-panel p-6 flex flex-col justify-center">
          <p className="text-[--color-text-muted] text-sm font-medium mb-1 uppercase tracking-widest text-[10px]">Signups (Total)</p>
          <p className="text-4xl font-bold text-emerald-500">{signupCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-[--color-text-base] mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-theme-500" />
              Quick Actions
            </h2>
            <div className="space-y-4">
              <Link href="/admin/organizations" className="flex items-center gap-3 w-full p-4 bg-theme-500/5 hover:bg-theme-500/10 rounded-xl transition-all border border-theme-500/10 font-bold group">
                <div className="w-8 h-8 rounded-lg bg-theme-500/10 flex items-center justify-center text-theme-500 group-hover:scale-110 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                Portal Management
              </Link>
              <Link href="/admin/chains" className="flex items-center gap-3 w-full p-4 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-xl transition-all border border-emerald-500/10 font-bold group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                Schedule Prayer
              </Link>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8">
          <div className="glass-panel p-6 sm:p-8">
            <ActivityLogClient initialActivities={recentActivities as any} />
          </div>
        </div>
      </div>
    </div>
  );
}
