"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { markPrayedFor } from "@/app/[org-slug]/actions";

export default function PrayButton({ prayerId, className = "" }: { prayerId: string, className?: string }) {
  const [prayed, setPrayed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePray = async () => {
    if (prayed) return;
    
    // Optimistic UI update
    setPrayed(true);
    const result = await markPrayedFor(prayerId);
    
    if (result.error) {
      // Revert if failed
      setPrayed(false);
      console.error(result.error);
    }
  };

  return (
    <motion.button
      className={`relative overflow-hidden font-medium text-sm transition-all duration-300 w-full rounded-b-xl py-3 border-t ${
        prayed 
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default" 
          : "bg-[--color-bg-panel]/20 text-[--color-text-muted] hover:bg-theme-500/20 hover:text-indigo-300 border-[--color-glass-border] cursor-pointer"
      } ${className}`}
      onClick={handlePray}
      disabled={prayed}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={!prayed ? { scale: 0.98 } : {}}
      initial={false}
      animate={{ backgroundColor: prayed ? "rgba(16, 185, 129, 0.1)" : isHovered ? "rgba(99, 102, 241, 0.2)" : "rgba(30, 41, 59, 0.2)" }}
    >
      <div className="flex items-center justify-center space-x-2">
        <motion.span 
          animate={prayed ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {prayed ? "🙏" : "🤍"}
        </motion.span>
        <span>
          {prayed ? "Prayed for this" : "I'm praying for this"}
        </span>
      </div>
      
      {prayed && (
        <motion.div 
          className="absolute inset-0 bg-emerald-400/10"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
