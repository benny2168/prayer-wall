"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { markPrayedFor } from "@/app/[org-slug]/actions";

export default function PrayButton({ 
  prayerId, 
  initialCount = 0,
  className = "" 
}: { 
  prayerId: string, 
  initialCount?: number,
  className?: string 
}) {
  const [prayed, setPrayed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [count, setCount] = useState(initialCount);

  const handlePray = async () => {
    if (prayed) return;
    
    // Optimistic UI update
    setPrayed(true);
    setCount(prev => prev + 1);

    const result = await markPrayedFor(prayerId);
    
    if (result.error) {
      // Revert if failed
      setPrayed(false);
      setCount(prev => Math.max(0, prev - 1));
      console.error(result.error);
    } else if (result.count !== undefined) {
      // Sync with server count if returned
      setCount(result.count);
    }
  };

  return (
    <motion.button
      className={`relative overflow-hidden font-semibold text-sm transition-all duration-300 w-full rounded-b-xl py-3 border ${
        prayed 
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 cursor-default" 
          : "bg-theme-500/35 dark:bg-theme-300/15 text-[--color-text-title] hover:bg-theme-500/50 dark:hover:bg-theme-300/25 hover:text-[--color-text-theme] border-[--color-glass-border] cursor-pointer"
      } ${className}`}
      onClick={handlePray}
      disabled={prayed}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={!prayed ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center justify-center space-x-3">
        <motion.div 
          className="flex items-center gap-1.5"
          animate={prayed ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {prayed ? (
            <span className="text-sm">🙏</span>
          ) : (
            <Heart 
              className={`w-4 h-4 transition-all duration-300 ${
                isHovered ? "scale-115 fill-current" : "scale-100"
              } text-[--color-text-title]`} 
            />
          )}
          {count > 0 && (
            <span className={`text-xs font-bold transition-colors ${prayed ? "text-emerald-600 dark:text-emerald-400" : "text-[--color-text-base]"}`}>
              {count}
            </span>
          )}
        </motion.div>
        <span className="font-extrabold uppercase tracking-tight">
          {prayed ? "Prayed" : "I'm praying for this"}
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
