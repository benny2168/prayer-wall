import { prisma } from "@/lib/prisma";
import { Mail, Clock, ShieldCheck, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import EmailPreviewTabs from "@/components/EmailPreviewTabs";
import { getEmailTheme } from "@/lib/email_utils";

export const revalidate = 0;

export default async function AdminRemindersPage() {
  const [upcomingReminders, emailTheme, testChain] = await Promise.all([
    prisma.prayerChainSignup.findMany({
      where: {
        wantsReminder: true,
        startTime: { gt: new Date() }
      },
      include: {
        prayerChain: { include: { organization: true } }
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    }),
    getEmailTheme(),
    prisma.prayerChain.findFirst({
      include: { organization: true }
    })
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight flex items-center justify-center lg:justify-start gap-4">
          Email Audits
        </h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">
          Monitor your intercession ecosystem's notification health and preview branded communication templates.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        <div className="xl:col-span-12 glass-panel p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-theme-500/10 text-theme-500 flex items-center justify-center shadow-lg shadow-theme-500/10">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[--color-text-base]">Template Previews</h2>
              <p className="text-sm text-[--color-text-muted] font-medium">Verify how your intercessors see communications on both desktop and mobile.</p>
            </div>
          </div>
          
          <EmailPreviewTabs 
            primaryColor={emailTheme.primaryColor} 
            logoUrl={emailTheme.logoUrl} 
            orgName={testChain?.organization.name || "Main Church"}
            chainTitle={testChain?.title || "24/7 Prayer Watch"}
          />
        </div>

        <div className="xl:col-span-12">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[--color-text-base]">Scheduled Reminders</h2>
              <p className="text-sm text-[--color-text-muted] font-medium">Upcoming automated notifications queued for delivery.</p>
            </div>
          </div>

      <div className="grid grid-cols-1 gap-6">
        {upcomingReminders.length > 0 ? (
          upcomingReminders.map((signup) => (
            <div 
              key={signup.id}
              className="glass-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-theme-500/10 text-theme-500 flex items-center justify-center flex-shrink-0 border border-theme-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-[--color-text-base] truncate">{signup.name}</h3>
                  <p className="text-sm text-[--color-text-muted] font-medium truncate">{signup.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-theme-500 uppercase tracking-widest bg-theme-500/5 px-2 py-0.5 rounded border border-theme-500/10">
                       {(signup as any).prayerChain.organization.name}
                    </span>
                    <span className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-widest">
                       • {(signup as any).prayerChain.title}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-12">
                <div className="text-left lg:text-right">
                  <div className="flex items-center lg:justify-end gap-2 text-[--color-text-base] font-bold">
                    <Clock className="w-4 h-4 text-theme-500" />
                    <span className="whitespace-nowrap">
                      {signup.startTime.toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-[--color-text-muted] mt-1 font-medium italic lg:justify-end flex">
                    Reminder scheduled 15m before
                  </p>
                </div>
                
                <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  QUEUED
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-20 text-center space-y-4">
            <div className="inline-flex p-6 rounded-full bg-theme-500/5 text-[--color-text-muted]">
              <AlertCircle className="w-12 h-12 opacity-30" />
            </div>
            <h2 className="text-xl font-bold text-[--color-text-base]">No Pending Reminders</h2>
            <p className="text-[--color-text-muted] max-w-sm mx-auto">
              When users sign up for intercession slots and opt-in for notifications, they will appear here.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
