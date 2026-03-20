"use client";

import { useState, useEffect } from "react";
import PrayerChainSignupForm from "./PrayerChainSignupForm";
import { motion, AnimatePresence } from "framer-motion";

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
  startTime: Date;
  name: string;
};

export default function PrayerChainSchedule({
  chain,
  signups,
}: {
  chain: ChainData;
  signups: SignupData[];
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Generate an array of dates from start_time to end_time
  const getDatesBetween = (start: Date, end: Date) => {
    const dates = [];
    
    // Ensure we are working with Date objects (Next.js App Router passes them as strings to client components)
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Extract exact UTC parts (which matches user's string input) and create local Date
    let current = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const last = new Date(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    while (current <= last) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const allDates = getDatesBetween(chain.start_time, chain.end_time);

  // Default to today if within range, otherwise use the closest past date, or index 0
  useEffect(() => {
    if (allDates.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Find if today is in the array
      const todayIndex = allDates.findIndex(
        (d) => d.setHours(0,0,0,0) === now.getTime()
      );

      if (todayIndex !== -1) {
        setCurrentDateIndex(todayIndex);
      } else {
        // If today isn't in the range, find the closest date that has already happened
        // Or default to 0 if all dates are in the future
        let closestIndex = 0;
        for (let i = 0; i < allDates.length; i++) {
          if (allDates[i].getTime() < now.getTime()) {
            closestIndex = i;
          } else {
            break;
          }
        }
        setCurrentDateIndex(closestIndex);
      }
    }
  }, [chain.start_time, chain.end_time]);

  const currentDate = allDates[currentDateIndex];

  // Generate slots for the currently selected date
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
            
            return (
              <motion.button
                key={slot.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 ${
                  isFull || isPast
                    ? "bg-[--color-bg-panel]/80 border border-[--color-border-base] cursor-not-allowed" 
                    : "glass-card hover:border-theme-500/50 cursor-pointer"
                }`}
                onClick={() => !isFull && !isPast && setSelectedSlot(slot.toISOString())}
                disabled={isFull || isPast}
              >
                <span className="text-lg font-bold text-[--color-text-base] mb-2">
                  {slot.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
                
                {/* Names of the people who signed up */}
                {slotSignups.length > 0 && (
                  <div className="flex flex-col items-center mb-2 space-y-1">
                    {slotSignups.map((s, idx) => (
                      <span key={idx} className="text-sm font-medium text-[--color-text-base] bg-[--color-bg-panel] px-2 py-0.5 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}

                <span className={`text-xs mt-1 ${
                  isPast 
                    ? "text-[--color-text-muted] font-medium"
                    : isFull 
                      ? "text-red-500 dark:text-red-400 font-semibold" 
                      : "text-emerald-600 dark:text-emerald-400 font-medium"
                }`}>
                  {isPast ? "Time passed" : isFull ? "Full" : `${chain.max_people_per_block - signupCount} slots left`}
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {selectedSlot && (
        <PrayerChainSignupForm
          chainId={chain.id}
          availableStartTime={selectedSlot}
          onCancel={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
