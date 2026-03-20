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
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-theme-500/20 text-indigo-300 border border-theme-500/30">
                    {prayer.organization.name}
                  </span>
                  <span className="text-[--color-text-muted] text-xs text-medium">
                    {new Date(prayer.createdAt).toLocaleDateString()}
                  </span>
                  {!prayer.isPublic && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Private
                    </span>
                  )}
                </div>
                
                <p className="text-[--color-text-base] text-lg font-medium leading-relaxed mb-3">"{prayer.text}"</p>
                
                <div className="flex flex-wrap gap-x-4 text-sm text-[--color-text-muted]">
                  <p>👤 {prayer.name || "Anonymous"}</p>
                  {prayer.email && <p>✉️ {prayer.email}</p>}
                </div>
              </div>
              
              <div className="flex space-x-2 shrink-0 border-t border-[--color-border-base] pt-3 sm:border-0 sm:pt-0 mt-3 sm:mt-0">
                <button 
                  onClick={() => handleArchive(prayer.id)} 
                  className="px-4 py-2 bg-[--color-bg-panel] hover:bg-[--color-border-base] text-[--color-text-base] text-sm rounded-lg transition"
                >
                  {isArchivedView ? "Unarchive" : "Archive"}
                </button>
                <button 
                  onClick={() => handleDelete(prayer.id)} 
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm rounded-lg transition"
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
