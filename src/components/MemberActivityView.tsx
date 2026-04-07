"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Signup = {
  id: string;
  startTime: string;
  name: string;
  prayerChain: {
    id: string;
    title: string;
    organization: { name: string; slug: string };
  };
};

type Prayer = {
  id: string;
  text: string;
  name: string | null;
  isPublic: boolean;
  prayer_count: number;
  createdAt: Date | string;
  organization: { name: string; slug: string };
};

type Tab = "signups" | "prayers";

export default function MemberActivityView({ isAdminView = false }: { isAdminView?: boolean }) {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("signups");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/member/signups")
        .then((r) => r.json())
        .then(async (data) => {
          if (data.email) {
            setSignups(data.signups || []);
            const pRes = await fetch("/api/member/prayers");
            const pData = await pRes.json();
            setPrayers(pData.prayers || []);
          }
        })
        .catch(() => {});
    }
  }, [status]);

  const handleCancel = async (signupId: string) => {
    if (!confirm("Cancel this prayer time slot?")) return;
    setCancellingId(signupId);
    const res = await fetch(`/api/member/signups/${signupId}`, { method: "DELETE" });
    if (res.ok) setSignups((prev) => prev.filter((s) => s.id !== signupId));
    setCancellingId(null);
  };

  const handleEditSave = async (prayerId: string) => {
    if (!editText.trim()) return;
    setSavingId(prayerId);
    const res = await fetch(`/api/member/prayers/${prayerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText }),
    });
    if (res.ok) {
      setPrayers((prev) => prev.map((p) => (p.id === prayerId ? { ...p, text: editText } : p)));
      setEditingId(null);
    }
    setSavingId(null);
  };

  const handleDeletePrayer = async (prayerId: string) => {
    if (!confirm("Remove this prayer from the wall?")) return;
    const res = await fetch(`/api/member/prayers/${prayerId}`, { method: "DELETE" });
    if (res.ok) setPrayers((prev) => prev.filter((p) => p.id !== prayerId));
  };

  if (status === "loading") {
    return (
      <div className="p-12 flex justify-center items-start">
        <div className="w-8 h-8 border-4 border-theme-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = signups.filter((s) => new Date(s.startTime) >= now);
  const past = signups.filter((s) => new Date(s.startTime) < now);

  const containerClasses = isAdminView 
    ? "space-y-6" 
    : "w-full max-w-2xl mx-auto space-y-8 relative z-10 pt-16";

  const cardClasses = "bg-[--color-bg-panel] border border-[--color-glass-border] rounded-2xl p-6 shadow-sm";
  const itemClasses = "bg-black/5 dark:bg-black/20 backdrop-blur-md border border-[--color-glass-border] rounded-2xl p-5 shadow-sm";

  return (
    <div className={containerClasses}>
      {!isAdminView && (
        <div>
          <Link href="/" className="text-[--color-text-muted] hover:text-[--color-text-base] text-sm inline-flex items-center mb-6 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-[--color-text-base]">My Prayer Activity</h1>
          <p className="text-[--color-text-muted] mt-2">Manage your prayer chain signups and prayer requests.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={isAdminView ? "space-y-6" : "space-y-6"}>
          <div className={cardClasses + " flex flex-col sm:flex-row items-center justify-between gap-4"}>
            <p className="text-[--color-text-muted] text-sm text-center sm:text-left">
              Signed in as <strong className="text-[--color-text-base] block text-base mt-0.5">{session?.user?.email}</strong>
            </p>
            {!isAdminView && (
              <Link href="/api/auth/signout?callbackUrl=/" className="text-sm font-medium text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors">
                Sign out
              </Link>
            )}
          </div>

          <div className="flex gap-2 border-b border-[--color-glass-border]">
            {(["signups", "prayers"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab 
                    ? "border-theme-500 text-theme-500" 
                    : "border-transparent text-[--color-text-muted] hover:text-[--color-text-base]"
                }`}
              >
                {tab === "signups" ? `Signups (${upcoming.length})` : `My Prayers (${prayers.length})`}
              </button>
            ))}
          </div>

          {activeTab === "signups" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-bold text-[--color-text-base] mb-3">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <div className={cardClasses + " p-8 text-center text-[--color-text-muted]"}>
                    No upcoming prayer slots. <Link href="/" className="text-theme-500 hover:underline">Find a chain to join →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((s) => (
                      <motion.div key={s.id} layout className={itemClasses + " flex items-center justify-between"}>
                        <div>
                          <p className="font-semibold text-lg font-serif text-[--color-text-base]">{s.prayerChain.title}</p>
                          <p className="text-xs text-[--color-text-muted]">{s.prayerChain.organization.name}</p>
                          <p className="text-sm text-theme-500 mt-2 font-medium">
                            {new Date(s.startTime).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancel(s.id)}
                          disabled={cancellingId === s.id}
                          className="text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 dark:text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors ml-4 shrink-0"
                        >
                          {cancellingId === s.id ? "Cancelling..." : "Cancel"}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {past.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-[--color-text-muted] mb-3">Past</h2>
                  <div className="space-y-3 opacity-60">
                    {past.slice(0, 5).map((s) => (
                      <div key={s.id} className="bg-black/5 dark:bg-white/5 border border-[--color-glass-border] rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-[--color-text-base]">{s.prayerChain.title}</p>
                          <p className="text-xs text-[--color-text-muted] mt-1">
                            {new Date(s.startTime).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-xs text-[--color-text-muted] ml-4">✓ Completed</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "prayers" && (
            <div className="space-y-4">
              {prayers.length === 0 ? (
                <div className={cardClasses + " p-8 text-center text-[--color-text-muted]"}>
                  No prayer requests found.
                </div>
              ) : (
                prayers.map((p) => (
                  <motion.div key={p.id} layout className={itemClasses + " space-y-4"}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-theme-500 uppercase tracking-wider">
                            {p.organization.name} · {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                          {p.prayer_count > 0 && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              🙏 {p.prayer_count} {p.prayer_count === 1 ? "prayer" : "prayers"}
                            </span>
                          )}
                        </div>
                        {editingId === p.id ? (
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full bg-[--color-bg-base] border border-[--color-border-base] rounded-xl p-3 focus:ring-2 focus:ring-theme-500 text-sm resize-none text-[--color-text-base]"
                            autoFocus
                          />
                        ) : (
                          <p className="text-[--color-text-base] leading-relaxed whitespace-pre-wrap text-lg font-serif italic text-left">
                            &ldquo;{p.text}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end border-t border-[--color-glass-border] pt-4">
                      {editingId === p.id ? (
                        <>
                          <button onClick={() => setEditingId(null)} className="text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] transition-colors px-3 py-1.5">
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditSave(p.id)}
                            disabled={savingId === p.id}
                            className="bg-theme-600 hover:bg-theme-500 text-white font-medium text-sm py-1.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {savingId === p.id ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(p.id); setEditText(p.text); }} className="text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleDeletePrayer(p.id)} className="text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 transition-colors">
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
