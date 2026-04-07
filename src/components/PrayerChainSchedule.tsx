"use client";

import { useState, useEffect } from "react";
import PrayerChainSignupForm from "./PrayerChainSignupForm";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShieldCheck, Mail, Clock } from "lucide-react";
import { cancelPrayerChainSignup } from "@/app/[org-slug]/chain/actions";

type ChainData = {
  id: string;
  start_time: Date;
  end_time: Date;
  daily_start: string;
  daily_end: string;
  block_duration_mins: number;
  max_people_per_block: number;
};

type SignupData = {
  id: string;
  startTime: Date;
  name: string;
  email: string | null;
};

export default function PrayerChainSchedule({
  chain,
  signups,
  user,
}: {
  chain: ChainData;
  signups: SignupData[];
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find the details for a selected signup
  const selectedDetailSignup = signups.find(s => s.id === selectedDetailId);

  // Generate an array of dates from start_time to end_time
  const getDatesBetween = (start: Date, end: Date) => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    let current = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const last = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
    while (current <= last) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const allDates = getDatesBetween(chain.start_time, chain.end_time);

  useEffect(() => {
    if (allDates.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayIndex = allDates.findIndex(d => d.setHours(0,0,0,0) === now.getTime());
      if (todayIndex !== -1) setCurrentDateIndex(todayIndex);
      else {
        let closestIndex = 0;
        for (let i = 0; i < allDates.length; i++) {
          if (allDates[i].getTime() < now.getTime()) closestIndex = i;
          else break;
        }
        setCurrentDateIndex(closestIndex);
      }
    }
  }, [chain.start_time, chain.end_time]);

  const currentDate = allDates[currentDateIndex];

  const generateSlotsForDate = (date: Date) => {
    const slots = [];
    const [startHour, startMin] = chain.daily_start.split(":").map(Number);
    const [endHour, endMin] = chain.daily_end.split(":").map(Number);
    let currentSlot = new Date(date);
    currentSlot.setHours(startHour || 0, startMin || 0, 0, 0);
    let endSlot = new Date(date);
    endSlot.setHours(endHour || 23, endMin || 59, 0, 0);
    while (currentSlot < endSlot) {
      slots.push(new Date(currentSlot));
      currentSlot = new Date(currentSlot.getTime() + chain.block_duration_mins * 60000);
    }
    return slots;
  };

  const slots = currentDate ? generateSlotsForDate(currentDate) : [];

  const handleDropCommitment = async (id: string) => {
    if (!confirm("Are you sure you want to drop this prayer commitment?")) return;
    setIsDeleting(true);
    const result = await cancelPrayerChainSignup(id);
    if (result.success) {
      setSelectedDetailId(null);
    } else {
      alert(result.error);
    }
    setIsDeleting(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-[--color-bg-panel]/50 p-4 rounded-2xl border border-[--color-glass-border]">
        <button 
          onClick={() => setCurrentDateIndex(Math.max(0, currentDateIndex - 1))}
          disabled={currentDateIndex === 0}
          className="p-2 text-[--color-text-muted] hover:text-[--color-text-base] disabled:opacity-30 transition-colors"
        >
          ← Previous Day
        </button>
        <div className="text-xl font-bold text-[--color-text-base] text-center">
          {currentDate?.toLocaleDateString(undefined, {
            weekday: "long", month: "long", day: "numeric"
          })}
        </div>
        <button 
          onClick={() => setCurrentDateIndex(Math.min(allDates.length - 1, currentDateIndex + 1))}
          disabled={currentDateIndex === allDates.length - 1}
          className="p-2 text-[--color-text-muted] hover:text-[--color-text-base] disabled:opacity-30 transition-colors"
        >
          Next Day →
        </button>
      </div>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {slots.map((slot) => {
            const slotSignups = signups.filter(s => new Date(s.startTime).getTime() === slot.getTime());
            const signupCount = slotSignups.length;
            const isFull = signupCount >= chain.max_people_per_block;
            const isPast = slot.getTime() < new Date().getTime();
            
            // Check if THIS specific user is in this slot
            const mySignup = user?.email ? slotSignups.find(s => s.email === user.email) : null;
            
            return (
              <motion.button
                key={slot.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 relative group overflow-hidden ${
                  mySignup 
                    ? "bg-theme-500/10 border-2 border-theme-500 shadow-[0_0_20px_-5px_var(--color-theme-500/30)]"
                    : isPast 
                      ? "bg-[--color-bg-panel]/80 border border-[--color-border-base] cursor-not-allowed" 
                      : isFull
                        ? "bg-[--color-bg-panel]/90 border border-[--color-border-base] cursor-pointer hover:border-[--color-text-theme]/30"
                        : "glass-card hover:border-theme-500/50 cursor-pointer"
                }`}
                onClick={() => {
                  if (mySignup) setSelectedDetailId(mySignup.id);
                  else if (isFull) setSelectedDetailId(slotSignups[0].id); // Just show the first one for now (admin/details)
                  else if (!isPast) setSelectedSlot(slot.toISOString());
                }}
                disabled={isPast && !mySignup}
              >
                {mySignup && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-theme-500 animate-pulse" />
                  </div>
                )}

                <span className="text-lg font-bold text-[--color-text-base] mb-2">
                  {slot.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                
                {slotSignups.length > 0 && (
                  <div className="flex flex-col items-center mb-2 space-y-1">
                    {slotSignups.map((s, idx) => (
                      <span key={idx} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        s.email === user?.email ? "bg-theme-500 text-white" : "bg-[--color-bg-panel] text-[--color-text-muted]"
                      }`}>
                        {s.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}

                <span className={`text-[10px] uppercase tracking-tighter mt-1 font-bold ${
                  mySignup 
                    ? "text-theme-500"
                    : isPast 
                      ? "text-[--color-text-muted]"
                      : isFull 
                        ? "text-red-500 dark:text-red-400" 
                        : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {mySignup ? "YOUR SLOT" : isPast ? "Time passed" : isFull ? "Full" : `${chain.max_people_per_block - signupCount} slots left`}
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Commitment Detail Modal */}
      <AnimatePresence>
        {selectedDetailId && selectedDetailSignup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedDetailId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg bg-[--color-glass] backdrop-blur-2xl border border-[--color-glass-border] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[--color-text-base]">Commitment Details</h3>
                <button
                  onClick={() => setSelectedDetailId(null)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors text-[--color-text-muted] hover:text-[--color-text-base]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[--color-text-muted] text-lg mb-8">
                Viewing registration for: <br/>
                <span className="font-bold text-theme-600 dark:text-theme-400">
                  {new Date(selectedDetailSignup.startTime).toLocaleString(undefined, {
                    weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                  })}
                </span>
              </p>

              <div className="space-y-6 py-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme] mb-1 opacity-60">Full Name</span>
                    <span className="text-2xl font-bold text-[--color-text-base] tracking-tight">{selectedDetailSignup.name}</span>
                  </div>
                  
                  {selectedDetailSignup.email && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme] mb-1 opacity-60">Email Address</span>
                      <span className="text-lg font-semibold text-[--color-text-base] truncate">{selectedDetailSignup.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 flex justify-end space-x-3 border-t border-[--color-glass-border]/50">
                  <button 
                    onClick={() => setSelectedDetailId(null)} 
                    className="text-sm text-[--color-text-muted] hover:text-[--color-text-base] px-4 font-medium transition-colors"
                  >
                    Close
                  </button>
                  
                  {selectedDetailSignup.email === user?.email && (
                    <button
                      onClick={() => handleDropCommitment(selectedDetailSignup.id)}
                      disabled={isDeleting}
                      className="btn-primary !bg-red-500/80 hover:!bg-red-600 !shadow-red-500/20 min-w-[140px]"
                    >
                      {isDeleting ? "Processing..." : "Drop My Commitment"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedSlot && (
        <PrayerChainSignupForm
          chainId={chain.id}
          availableStartTime={selectedSlot}
          user={user}
          onCancel={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}

