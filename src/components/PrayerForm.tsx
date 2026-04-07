"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { submitPrayer } from "@/app/[org-slug]/actions";
import Link from "next/link";
import { User, X } from "lucide-react";

export default function PrayerForm({ 
  orgId,
  orgSlug,
  chains = []
}: { 
  orgId: string;
  orgSlug?: string;
  chains?: any[];
}) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [notifyIfPrayed, setNotifyIfPrayed] = useState(false);

  const now = new Date();
  const activeChains = chains.filter(c => {
    if (!c.start_time || !c.end_time) return true; // fallback
    return now >= new Date(c.start_time) && now <= new Date(c.end_time);
  });

  const displayName = session?.user?.name || "Member";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      text: formData.get("text") as string,
      name: session ? undefined : formData.get("name") as string,
      email: session ? undefined : formData.get("email") as string,
      notify_if_prayed: notifyIfPrayed,
      isPublic,
      isAnonymous,
    };

    const res = await submitPrayer(orgId, data);
    
    setIsSubmitting(false);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setIsAnonymous(false);
        setIsPublic(true);
        setNotifyIfPrayed(false);
      }, 2500);
    } else {
      alert(res.error || "Something went wrong.");
    }
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[--color-glass] backdrop-blur-2xl border border-[--color-glass-border] w-full max-w-lg p-6 sm:p-8 text-left relative rounded-2xl shadow-2xl"
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[--color-text-base]">
                  New Prayer Request
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors p-2 rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    className="text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-8 rounded-xl text-center"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-5xl mb-3">🙏</div>
                    <p className="font-medium text-lg">Your prayer has been shared.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Text input */}
                    <textarea
                      name="text"
                      required
                      placeholder="What is on your heart?"
                      className="input-field min-h-[120px] resize-y"
                    />

                    {/* Identity row */}
                    {session ? (
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-full bg-theme-500/10 flex items-center justify-center border border-theme-500/20 shrink-0">
                          <User className="w-4 h-4 text-theme-500" />
                        </div>
                        <div>
                          <p className="text-xs text-[--color-text-muted] font-medium">Posting as</p>
                          <p className="text-[--color-text-base] font-semibold text-sm">
                            {isAnonymous ? (
                              <span className="italic text-[--color-text-muted]">Anonymous</span>
                            ) : displayName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Your Name (Optional)" className="input-field" />
                        <input type="email" name="email" placeholder="Email Address (Optional)" className="input-field" />
                      </div>
                    )}

                    {/* Options — checkboxes */}
                    <div className="flex flex-wrap gap-2">
                      {session && (
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(!isAnonymous)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            isAnonymous
                              ? "bg-theme-600/20 border-theme-500/50 text-theme-400"
                              : "bg-[--color-glass] border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:bg-[--color-glass-hover] hover:border-[--color-text-muted]"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            isAnonymous ? "border-theme-500 bg-theme-500" : "border-[--color-text-muted]"
                          }`}>
                            {isAnonymous && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </span>
                          Post Anonymously
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsPublic(!isPublic)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          isPublic
                            ? "bg-theme-600/20 border-theme-500/50 text-theme-400"
                            : "bg-[--color-glass] border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:bg-[--color-glass-hover] hover:border-[--color-text-muted]"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          isPublic ? "border-theme-500 bg-theme-500" : "border-[--color-text-muted]"
                        }`}>
                          {isPublic && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </span>
                        Post to Wall
                      </button>

                      <button
                        type="button"
                        onClick={() => setNotifyIfPrayed(!notifyIfPrayed)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                          notifyIfPrayed
                            ? "bg-theme-600/20 border-theme-500/50 text-theme-400"
                            : "bg-[--color-glass] border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:bg-[--color-glass-hover] hover:border-[--color-text-muted]"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          notifyIfPrayed ? "border-theme-500 bg-theme-500" : "border-[--color-text-muted]"
                        }`}>
                          {notifyIfPrayed && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                            </svg>
                          )}
                        </span>
                        Email Me When Prayed For
                      </button>
                    </div>

                    {/* Submit */}
                    <div className="pt-2 flex justify-end">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <motion.button
        className="btn-primary text-lg shadow-lg shadow-theme-500/30 whitespace-nowrap"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Share a Prayer Request
      </motion.button>

      {activeChains.length > 0 && orgSlug && (
        <Link 
          href={activeChains.length === 1 ? `/${orgSlug}/chain/${activeChains[0].id}` : `/${orgSlug}/chain`}
          className="w-full sm:w-auto"
        >
          <motion.button
            className="btn-primary text-lg shadow-lg shadow-theme-500/30 w-full whitespace-nowrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Prayer Chains
          </motion.button>
        </Link>
      )}

      {/* Portal modal */}
      {typeof window !== "undefined" && createPortal(modal, document.body)}
    </div>
  );
}
