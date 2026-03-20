"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  createdAt: string;
  organization: { name: string; slug: string };
};

type ViewState = "login-email" | "login-code" | "dashboard";
type Tab = "signups" | "prayers";

export default function MySignupsPage() {
  const [view, setView] = useState<ViewState>("login-email");
  const [activeTab, setActiveTab] = useState<Tab>("signups");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [signups, setSignups] = useState<Signup[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [memberEmail, setMemberEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    fetch("/api/member/signups")
      .then(r => r.json())
      .then(async data => {
        if (data.email) {
          setMemberEmail(data.email);
          setSignups(data.signups);
          const pRes = await fetch("/api/member/prayers");
          const pData = await pRes.json();
          setPrayers(pData.prayers || []);
          setView("dashboard");
        }
      })
      .catch(() => {});
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/member/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setView("login-code");
    } else {
      setError(data.error || "Something went wrong.");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/member/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (data.success) {
      const [sigRes, pRes] = await Promise.all([
        fetch("/api/member/signups"),
        fetch("/api/member/prayers"),
      ]);
      const sigData = await sigRes.json();
      const pData = await pRes.json();
      setMemberEmail(sigData.email);
      setSignups(sigData.signups);
      setPrayers(pData.prayers || []);
      setView("dashboard");
    } else {
      setError(data.error || "Invalid code.");
    }
    setLoading(false);
  };

  const handleCancel = async (signupId: string) => {
    if (!confirm("Cancel this prayer time slot?")) return;
    setCancellingId(signupId);
    const res = await fetch(`/api/member/signups/${signupId}`, { method: "DELETE" });
    if (res.ok) setSignups(prev => prev.filter(s => s.id !== signupId));
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
      setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, text: editText } : p));
      setEditingId(null);
    }
    setSavingId(null);
  };

  const handleDeletePrayer = async (prayerId: string) => {
    if (!confirm("Remove this prayer from the wall?")) return;
    const res = await fetch(`/api/member/prayers/${prayerId}`, { method: "DELETE" });
    if (res.ok) setPrayers(prev => prev.filter(p => p.id !== prayerId));
  };

  const now = new Date();
  const upcoming = signups.filter(s => new Date(s.startTime) >= now);
  const past = signups.filter(s => new Date(s.startTime) < now);

  return (
    <main className="min-h-screen relative p-4 sm:p-12 overflow-x-hidden flex items-start justify-center">
      <div className="w-full max-w-2xl mx-auto pt-16 space-y-8">
        
        {/* Header */}
        <div>
          <Link href="/" className="text-[--color-text-muted] hover:text-[--color-text-base] text-sm inline-flex items-center mb-6 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[--color-text-base]">My Prayer Portal</h1>
          <p className="text-[--color-text-muted] mt-2">Manage your prayer chain signups and prayer requests.</p>
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Email */}
          {view === "login-email" && (
            <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white/85 dark:bg-theme-900/95 backdrop-blur-2xl border border-[--color-glass-border] rounded-2xl p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[--color-text-base]">Sign in with your email</h2>
                  <p className="text-[--color-text-muted] text-sm mt-1">Enter the email you used when signing up for a prayer slot or posting a prayer. We&apos;ll send you a verification code.</p>
                </div>
                <form onSubmit={handleSendCode} className="space-y-4">
                  {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium text-[--color-text-muted] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Sending..." : "Send Code →"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: OTP Code */}
          {view === "login-code" && (
            <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white/85 dark:bg-theme-900/95 backdrop-blur-2xl border border-[--color-glass-border] rounded-2xl p-8 shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[--color-text-base]">Check your email</h2>
                  <p className="text-[--color-text-muted] text-sm mt-1">
                    We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
                  </p>
                </div>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium text-[--color-text-muted] mb-1">Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="input-field text-center text-2xl tracking-widest font-bold"
                    />
                  </div>
                  <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
                    {loading ? "Verifying..." : "Verify Code →"}
                  </button>
                  <button type="button" onClick={() => { setView("login-email"); setError(null); setCode(""); }} className="w-full text-sm text-[--color-text-muted] hover:text-[--color-text-base] transition-colors">
                    ← Use a different email
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Dashboard */}
          {view === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <p className="text-[--color-text-muted] text-sm">Signed in as <strong className="text-[--color-text-base]">{memberEmail}</strong></p>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-[--color-glass-border]">
                {(["signups", "prayers"] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-theme-500 text-theme-500"
                        : "border-transparent text-[--color-text-muted] hover:text-[--color-text-base]"
                    }`}
                  >
                    {tab === "signups" ? `Prayer Signups (${upcoming.length})` : `My Prayers (${prayers.length})`}
                  </button>
                ))}
              </div>

              {/* Signups Tab */}
              {activeTab === "signups" && (
                <div className="space-y-6">
                  <section>
                    <h2 className="text-lg font-bold text-[--color-text-base] mb-3">Upcoming</h2>
                    {upcoming.length === 0 ? (
                      <div className="glass-panel p-8 text-center text-[--color-text-muted]">
                        No upcoming prayer slots. <Link href="/" className="text-theme-500 hover:underline">Find a chain to join →</Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcoming.map(s => (
                          <motion.div key={s.id} layout className="bg-white/85 dark:bg-theme-900/95 backdrop-blur-xl border border-[--color-glass-border] rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div>
                              <p className="font-semibold text-[--color-text-base]">{s.prayerChain.title}</p>
                              <p className="text-xs text-[--color-text-muted]">{s.prayerChain.organization.name}</p>
                              <p className="text-sm text-theme-500 mt-1 font-medium">
                                {new Date(s.startTime).toLocaleString(undefined, {
                                  weekday: "short", month: "short", day: "numeric",
                                  hour: "numeric", minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCancel(s.id)}
                              disabled={cancellingId === s.id}
                              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors ml-4 shrink-0"
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
                        {past.slice(0, 5).map(s => (
                          <div key={s.id} className="glass-card p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[--color-text-base]">{s.prayerChain.title}</p>
                              <p className="text-sm text-[--color-text-muted] mt-1">
                                {new Date(s.startTime).toLocaleString(undefined, {
                                  weekday: "short", month: "short", day: "numeric",
                                  hour: "numeric", minute: "2-digit"
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

              {/* Prayers Tab */}
              {activeTab === "prayers" && (
                <div className="space-y-4">
                  {prayers.length === 0 ? (
                    <div className="glass-panel p-8 text-center text-[--color-text-muted]">
                      No prayer requests found for this email.
                    </div>
                  ) : (
                    prayers.map(p => (
                      <motion.div key={p.id} layout className="bg-white/85 dark:bg-theme-900/95 backdrop-blur-xl border border-[--color-glass-border] rounded-xl p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-[--color-text-muted] mb-1">{p.organization.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                            {editingId === p.id ? (
                              <textarea
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                rows={4}
                                className="input-field w-full text-sm resize-none"
                                autoFocus
                              />
                            ) : (
                              <p className="text-[--color-text-base] leading-relaxed whitespace-pre-wrap">&ldquo;{p.text}&rdquo;</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          {editingId === p.id ? (
                            <>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-sm text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleEditSave(p.id)}
                                disabled={savingId === p.id}
                                className="btn-primary text-sm py-1.5 px-4"
                              >
                                {savingId === p.id ? "Saving..." : "Save Changes"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(p.id); setEditText(p.text); }}
                                className="text-sm text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePrayer(p.id)}
                                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
                              >
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
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
