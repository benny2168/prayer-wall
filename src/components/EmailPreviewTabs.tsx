"use client";

import { useState } from "react";
import { generateThemedEmail } from "@/lib/email_shared";
import { Mail, CheckCircle, Clock, ShieldCheck, Monitor, Smartphone, Eye } from "lucide-react";

type EmailType = "CONFIRMATION" | "REMINDER";

export default function EmailPreviewTabs({ 
  primaryColor, 
  logoUrl,
  orgName,
  chainTitle
}: { 
  primaryColor: string; 
  logoUrl?: string | null;
  orgName: string;
  chainTitle: string;
}) {
  const [activeTab, setActiveTab] = useState<EmailType>("CONFIRMATION");
  const [viewMode, setViewMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");

  const previews: Record<EmailType, { title: string; content: string; subject: string }> = {
    CONFIRMATION: {
      subject: `Commitment Confirmed: ${chainTitle}`,
      title: "Commitment Confirmed",
      content: generateThemedEmail({
        title: "Commitment Confirmed",
        name: "Intercessor",
        logoUrl,
        primaryColor,
        content: `
          <p>Thank you for committing to pray for <strong>${chainTitle}</strong>.</p>
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${primaryColor};">Monday, May 12 • 8:00 AM</p>
          </div>
          <p style="margin-bottom: 24px;">Your commitment helps ensure a continuous chain of prayer for our community.</p>
          <div style="display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px;">
            <span>🔔</span>
            <span>We'll send you a reminder 15 minutes before your slot.</span>
          </div>
        `,
        footerText: `This is an automated message from the ${orgName} Prayer Wall.`
      })
    },
    REMINDER: {
      subject: `Reminder: Your prayer slot starts at 8:00 AM`,
      title: "Prayer Reminder",
      content: generateThemedEmail({
        title: "Prayer Reminder",
        name: "Intercessor",
        logoUrl,
        primaryColor,
        content: `
          <p>This is a reminder that your prayer slot for <strong>${chainTitle}</strong> starts in 15 minutes.</p>
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${primaryColor};">Monday, May 12 • 8:00 AM</p>
          </div>
          <p>Thank you for your faithful intercession. May you be blessed as you pray!</p>
        `,
        footerText: `This is an automated reminder from the ${orgName} Prayer Wall.`
      })
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-[--color-bg-panel]/50 p-1 rounded-2xl border border-[--color-glass-border] w-fit">
          <button
            onClick={() => setActiveTab("CONFIRMATION")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "CONFIRMATION" 
                ? "bg-theme-500 text-white shadow-lg shadow-theme-500/20" 
                : "text-[--color-text-muted] hover:text-[--color-text-base]"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Confirmation
          </button>
          <button
            onClick={() => setActiveTab("REMINDER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "REMINDER" 
                ? "bg-theme-500 text-white shadow-lg shadow-theme-500/20" 
                : "text-[--color-text-muted] hover:text-[--color-text-base]"
            }`}
          >
            <Clock className="w-4 h-4" />
            Reminder
          </button>
        </div>

        <div className="flex bg-[--color-bg-panel]/30 p-1 rounded-xl border border-[--color-glass-border]/50 w-fit self-end sm:self-auto">
          <button
            onClick={() => setViewMode("DESKTOP")}
            className={`p-2 rounded-lg transition-all ${viewMode === "DESKTOP" ? "bg-white/10 text-theme-500 shadow-sm" : "text-[--color-text-muted] opacity-50 hover:opacity-100"}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("MOBILE")}
            className={`p-2 rounded-lg transition-all ${viewMode === "MOBILE" ? "bg-white/10 text-theme-500 shadow-sm" : "text-[--color-text-muted] opacity-50 hover:opacity-100"}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative group">
         {/* Browser Chrome Simulation */}
         <div className="bg-[#f1f5f9] dark:bg-[#0f172a] border border-[--color-glass-border] rounded-t-2xl p-3 flex items-center gap-4">
            <div className="flex gap-1.5 ml-2">
               <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
               <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-white/50 dark:bg-black/20 rounded-lg px-3 py-1 text-[10px] text-[--color-text-muted] font-medium truncate flex items-center gap-2">
               <ShieldCheck className="w-3 h-3" />
               Subject: {previews[activeTab].subject}
            </div>
         </div>

         <div className={`mx-auto bg-white border-x border-b border-[--color-glass-border] transition-all duration-500 ease-in-out overflow-hidden ${viewMode === "MOBILE" ? "max-w-[375px] rounded-b-[40px] border-b-8" : "max-w-full rounded-b-2xl shadow-xl"}`}>
            <div className="p-4 sm:p-8 bg-white overflow-y-auto max-h-[600px] min-h-[400px]">
               <div dangerouslySetInnerHTML={{ __html: previews[activeTab].content }} />
            </div>
         </div>
         
         <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-theme-500 text-white flex items-center justify-center shadow-xl shadow-theme-500/40 z-10 animate-pulse">
            <Eye className="w-6 h-6" />
         </div>
      </div>
    </div>
  );
}
