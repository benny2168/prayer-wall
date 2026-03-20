"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitPrayer } from "@/app/[org-slug]/actions";

export default function PrayerForm({ 
  orgId,
  orgSlug,
  chains = []
}: { 
  orgId: string;
  orgSlug?: string;
  chains?: { id: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      text: formData.get("text") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      notify_if_prayed: formData.get("notify_if_prayed") === "on",
      isPublic: formData.get("isPublic") === "on",
    };

    const res = await submitPrayer(orgId, data);
    
    setIsSubmitting(false);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } else {
      alert(res.error || "Something went wrong.");
    }
  };

  return (
    <div className="w-full flex justify-center mb-12 relative z-20">
      {!isOpen ? (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <motion.button
            className="btn-primary text-lg shadow-lg shadow-theme-500/30"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Share a Prayer Request
          </motion.button>
          
          {chains.length > 0 && orgSlug && (
            <motion.a
              href={chains.length === 1 ? `/${orgSlug}/chain/${chains[0].id}` : `/${orgSlug}/chain`}
              className="btn-primary text-lg shadow-lg shadow-theme-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Prayer Chains
            </motion.a>
          )}
        </div>
      ) : (
        <motion.div
          className="glass-card p-6 sm:p-8 w-full max-w-2xl text-left"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              New Prayer Request
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors p-2"
            >
              ✕
            </button>
          </div>

          <AnimatePresence>
            {success ? (
              <motion.div 
                className="text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-4 rounded-xl text-center py-10"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="text-4xl mb-3">🙏</div>
                <p className="font-medium text-lg">Your prayer has been shared.</p>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div>
                  <textarea
                    name="text"
                    required
                    placeholder="What is on your heart?"
                    className="input-field min-h-[120px] resize-y"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name (Optional)"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address (Optional)"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-[--color-text-muted]">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" name="isPublic" defaultChecked className="rounded border-[--color-border-base] bg-[--color-bg-panel]/50 text-primary w-4 h-4" />
                    <span className="group-hover:text-[--color-text-base] transition-colors">Post publicly on the wall</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" name="notify_if_prayed" className="rounded border-[--color-border-base] bg-[--color-bg-panel]/50 text-primary w-4 h-4" />
                    <span className="group-hover:text-[--color-text-base] transition-colors">Email me if someone prays for this</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full sm:w-auto flex justify-center"
                  >
                    {isSubmitting ? "Submitting..." : "Post Request"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
