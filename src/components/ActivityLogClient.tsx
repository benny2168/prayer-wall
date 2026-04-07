"use client";

import { useState } from "react";
import { ActivityType } from "@prisma/client";
import { Clock, Filter, CheckCircle2, AlertCircle, PlusCircle, Pencil, Trash2, ShieldCheck, Palette, Mail } from "lucide-react";

type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  userId: string | null;
  user: { name: string | null } | null;
  organization: { name: string } | null;
};

const TYPE_ICONS: Record<string, any> = {
  ORG_CREATED: PlusCircle,
  ORG_UPDATED: Pencil,
  PRAYER_POSTED: CheckCircle2,
  CHAIN_CREATED: PlusCircle,
  CHAIN_UPDATED: Pencil,
  CHAIN_SIGNUP: ShieldCheck,
  CHAIN_CANCEL: Trash2,
  THEME_UPDATED: Palette,
  MEMBER_ROLE_UPDATED: ShieldCheck,
  EMAIL_SENT: Mail,
};

const TYPE_LABELS: Record<string, string> = {
  ORG_CREATED: "Organization Created",
  ORG_UPDATED: "Organization Updated",
  PRAYER_POSTED: "Prayer Posted",
  CHAIN_CREATED: "Chain Created",
  CHAIN_UPDATED: "Chain Updated",
  CHAIN_SIGNUP: "Chain Signup",
  CHAIN_CANCEL: "Chain Cancelled",
  THEME_UPDATED: "Theme Updated",
  MEMBER_ROLE_UPDATED: "Role Updated",
  EMAIL_SENT: "Email Notification",
};

export default function ActivityLogClient({ 
  initialActivities 
}: { 
  initialActivities: Activity[] 
}) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = initialActivities.filter(a => filter === "ALL" || a.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[--color-text-base]">System Activity</h2>
        <div className="flex items-center gap-2 bg-[--color-bg-panel]/50 border border-[--color-glass-border] rounded-full px-3 py-1.5 shadow-sm">
          <Filter className="w-4 h-4 text-[--color-text-muted]" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-transparent text-sm font-bold text-[--color-text-base] outline-none"
          >
            <option value="ALL">All Types</option>
            {Object.keys(TYPE_LABELS).map(type => (
              <option key={type} value={type}>{TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((activity) => {
            const Icon = TYPE_ICONS[activity.type] || AlertCircle;
            return (
              <div key={activity.id} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-theme-500/5 border border-transparent hover:border-theme-500/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-theme-500/10 text-theme-500 flex items-center justify-center shrink-0 border border-theme-500/20 shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-[--color-text-base] truncate">{activity.message}</p>
                    <span className="text-[10px] whitespace-nowrap text-[--color-text-muted] font-medium flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider">
                      {activity.user?.name || "System"}
                    </span>
                    {activity.organization && (
                      <span className="text-[10px] font-bold text-theme-500 uppercase tracking-widest bg-theme-500/5 px-2 py-0.5 rounded border border-theme-500/10">
                        {activity.organization.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center space-y-4">
             <Filter className="w-12 h-12 text-[--color-text-muted] opacity-20 mx-auto" />
             <p className="text-[--color-text-muted] font-medium">No activity matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
