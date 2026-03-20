"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signupForPrayerChainBlock } from "@/app/[org-slug]/chain/actions";

export default function PrayerChainSignupForm({
  chainId,
  availableStartTime,
  onCancel,
}: {
  chainId: string;
  availableStartTime: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-sm">
      <motion.div
        className="bg-white/85 dark:bg-theme-900/95 backdrop-blur-2xl border border-[--color-glass-border] w-full max-w-md p-6 relative shadow-2xl rounded-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[--color-text-muted] hover:text-[--color-text-base]"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-[--color-text-base] mb-2">Commit to Pray</h3>
        <p className="text-[--color-text-muted] text-sm mb-6">
          You are signing up for: <br/>
          <span className="font-semibold text-theme-600 dark:text-theme-400">{formattedTime}</span>
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
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 dark:border-red-500/50 rounded text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[--color-text-muted] mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="input-field py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[--color-text-muted] mb-1">Email Address <span className="opacity-60 text-xs font-normal">(Optional)</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  className="input-field py-2"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="text-sm text-[--color-text-muted] hover:text-[--color-text-base] px-4">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
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
