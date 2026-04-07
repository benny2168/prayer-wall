"use client";

import { useState } from "react";
import { archivePrayer, deletePrayer } from "@/app/admin/actions";
import { motion, AnimatePresence } from "framer-motion";

export default function PrayerAdminList({ initialPrayers, isArchivedView }: { initialPrayers: any[], isArchivedView: boolean }) {
  const [prayers, setPrayers] = useState(initialPrayers);

  const handleArchive = async (id: string) => {
    await archivePrayer(id, !isArchivedView);
    setPrayers(prayers.filter(p => p.id !== id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this prayer?")) return;
    await deletePrayer(id);
    setPrayers(prayers.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {prayers.map(prayer => (
          <motion.div 
            key={prayer.id}
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
            className="glass-panel p-5"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-[10px] font-bold text-theme-500 uppercase tracking-widest bg-theme-500/5 px-2 py-0.5 rounded border border-theme-500/10">
                    {prayer.organization.name}
                  </span>
                  <span className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-widest">
                    {new Date(prayer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {!prayer.isPublic && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Private Engagement
                    </span>
                  )}
                </div>
                
                <p className="text-[--color-text-base] text-lg font-serif italic leading-relaxed mb-4">"{prayer.text}"</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-theme-500/10 text-theme-500 flex items-center justify-center text-[10px] font-bold">
                      {prayer.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <span className="text-xs font-bold text-[--color-text-base]">{prayer.name || "Anonymous Intercessor"}</span>
                  </div>
                  {prayer.email && (
                    <span className="text-xs text-[--color-text-muted] font-medium opacity-60">
                      ✉️ {prayer.email}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                   <a 
                    href={`/${prayer.organization.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary py-1 px-3 text-[10px] border-theme-500/30 text-theme-500 hover:bg-theme-500/5 transition-all flex items-center gap-2"
                  >
                    ↗ View on Wall
                  </a>
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col gap-2 shrink-0 border-t border-[--color-border-base] pt-4 sm:border-0 sm:pt-0 mt-4 sm:mt-0 justify-end">
                <button 
                  onClick={() => handleArchive(prayer.id)} 
                  className="btn-secondary py-2 px-4 text-xs font-bold whitespace-nowrap"
                >
                  {isArchivedView ? "Unarchive" : "Archive"}
                </button>
                <button 
                  onClick={() => handleDelete(prayer.id)} 
                  className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
