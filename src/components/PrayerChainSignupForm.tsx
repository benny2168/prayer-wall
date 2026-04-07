"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signupForPrayerChainBlock } from "@/app/[org-slug]/chain/actions";
import { X } from "lucide-react";

export default function PrayerChainSignupForm({
  chainId,
  availableStartTime,
  user,
  onCancel,
}: {
  chainId: string;
  availableStartTime: string;
  user?: { name?: string | null; email?: string | null; phoneNumber?: string | null };
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formattedTime = new Date(availableStartTime).toLocaleString(undefined, {
    weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signupForPrayerChainBlock(chainId, {
      startTime: availableStartTime,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      wantsReminder: formData.get("wantsReminder") === "on",
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onCancel(); // Close form upon success
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isSubmitting && onCancel()}
      />

      {/* Modal Container */}
      <motion.div
        className="bg-[--color-glass] backdrop-blur-2xl border border-[--color-glass-border] w-full max-w-lg p-6 sm:p-8 text-left relative rounded-2xl shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[--color-text-base]">Commit to Pray</h3>
          <button
            onClick={onCancel}
            className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors p-2 rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[--color-text-muted] text-lg mb-8">
          You are signing up for: <br/>
          <span className="font-bold text-theme-600 dark:text-theme-400">{formattedTime}</span>
        </p>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <div className="text-4xl mb-4">✨</div>
              <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">Thank you for committing!</p>
              <p className="text-sm text-[--color-text-muted] mt-2">We will email you a reminder.</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 dark:border-red-500/50 rounded text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              {user ? (
                /* High-impact Static Display for Logged-in Users */
                <div className="space-y-6 py-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme] mb-1 opacity-60">Full Name</span>
                      <span className="text-2xl font-bold text-[--color-text-base] tracking-tight">{user.name || "N/A"}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme] mb-1 opacity-60">Email Address</span>
                        <span className="text-lg font-semibold text-[--color-text-base] truncate">{user.email || "N/A"}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme] mb-1 opacity-60">Phone Number</span>
                        <span className="text-lg font-semibold text-[--color-text-base]">{user.phoneNumber || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Confirmation Checkbox */}
                  <div className="flex items-center space-x-3 bg-white/5 border border-[--color-glass-border] p-4 rounded-xl cursor-not-allowed select-none">
                    <input
                      type="checkbox"
                      name="wantsReminder"
                      id="wantsReminder"
                      defaultChecked={true}
                      className="w-5 h-5 rounded border-[--color-glass-border] text-[--color-text-theme] focus:ring-[--color-text-theme] "
                    />
                    <label htmlFor="wantsReminder" className="text-sm font-medium text-[--color-text-base] cursor-pointer">
                      Email me a reminder 15 minutes before
                    </label>
                  </div>

                  {/* Hidden inputs for form data parity */}
                  <input type="hidden" name="name" value={user.name || ""} />
                  <input type="hidden" name="email" value={user.email || ""} />
                  <input type="hidden" name="phoneNumber" value={user.phoneNumber || ""} />
                </div>
              ) : (
                /* Traditional Inputs for Logged-out Users (if allowed) */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[--color-text-muted] px-1">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="How should we address you?"
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[--color-text-muted] px-1">Email Address <span className="opacity-60 text-xs font-normal ml-1">(Optional)</span></label>
                    <input
                      type="email"
                      name="email"
                      placeholder="To receive a reminder & link"
                      className="input-field"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[--color-text-muted] px-1">Phone Number <span className="opacity-60 text-xs font-normal ml-1">(Optional)</span></label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="For text reminders"
                      className="input-field"
                    />
                  </div>

                  {/* Confirmation Checkbox for anonymous too? Yes, usually helpful if they provided email. */}
                  <div className="flex items-center space-x-3 bg-white/5 border border-[--color-glass-border] p-4 rounded-xl">
                    <input
                      type="checkbox"
                      name="wantsReminder"
                      id="wantsReminderAnonymous"
                      defaultChecked={true}
                      className="w-5 h-5 rounded border-[--color-glass-border] text-[--color-text-theme] focus:ring-[--color-text-theme]"
                    />
                    <label htmlFor="wantsReminderAnonymous" className="text-sm font-medium text-[--color-text-muted] cursor-pointer">
                      Email me a reminder 15 minutes before
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="text-sm text-[--color-text-muted] hover:text-[--color-text-base] px-4">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary min-w-[140px]">
                  {isSubmitting ? "Confirming..." : "Confirm Time"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
