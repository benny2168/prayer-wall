"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { HandHeart, Mail, KeyRound, Loader2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginClient({ providers }: { providers: Record<string, any> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const oauthProviders = Object.values(providers || {}).filter((p) => p.type === "oauth");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/member/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }
      
      setSuccessMsg("If your email is registered in Planning Center, a code was sent.");
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError("");

    try {
      const res = await signIn("member-otp", {
        email,
        code,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid or expired code. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh(); // Ensure layout fetches updated session
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-bg-base] flex items-center justify-center p-4">
      {/* Visual background */}
      <div className="fixed inset-0 bg-gradient-to-br from-theme-500/5 via-theme-500/10 to-[--color-bg-base] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 my-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[--color-text-muted] hover:text-[--color-text-base] transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="bg-[--color-bg-panel] border border-[--color-border-base] rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="p-8 text-center border-b border-[--color-border-base]">
            <div className="w-12 h-12 bg-theme-500/20 text-theme-500 rounded-xl mx-auto flex items-center justify-center mb-4">
              <HandHeart className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[--color-text-base]">Sign In</h1>
            <p className="text-[--color-text-muted] mt-2 text-sm leading-relaxed">
              Verify your identity to access the Prayer Wall community.
            </p>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === "EMAIL" && (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  {error && <p className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}
                  
                  <div>
                    <label className="block text-sm font-medium text-[--color-text-base] mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-[--color-text-muted] pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-[--color-bg-base] border border-[--color-border-base] rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 text-[--color-text-base] transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-[--color-text-base] text-[--color-bg-base] hover:opacity-90 font-medium py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Login Code"}
                  </button>
                </motion.form>
              )}

              {step === "OTP" && (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-4"
                >
                  {successMsg && <p className="text-emerald-500 text-sm font-medium text-center bg-emerald-500/10 py-2.5 rounded-lg border border-emerald-500/20">{successMsg}</p>}
                  {error && <p className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2.5 rounded-lg border border-red-500/20">{error}</p>}
                  
                  <div>
                    <label className="block text-sm font-medium text-[--color-text-base] mb-1.5 flex justify-between">
                      <span>Verification Code</span>
                      <button type="button" onClick={() => setStep("EMAIL")} className="text-theme-500 hover:underline text-xs">
                        Change email
                      </button>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 w-5 h-5 text-[--color-text-muted] pointer-events-none" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-3 bg-[--color-bg-base] border border-[--color-border-base] rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 text-[--color-text-base] transition-all outline-none tracking-widest text-center text-lg font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full bg-[--color-text-base] text-[--color-bg-base] hover:opacity-90 font-medium py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Separator and OAuth Buttons */}
            {step === "EMAIL" && oauthProviders.length > 0 && (
              <div className="mt-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[--color-border-base]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[--color-bg-panel] px-4 text-[--color-text-muted]">Staff & Administrators</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {oauthProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => signIn(provider.id, { callbackUrl: callbackUrl.startsWith("/admin") ? callbackUrl : "/admin" })}
                      className={`w-full flex items-center justify-center space-x-3 px-6 py-3.5 rounded-xl font-medium transition-all border shadow-sm ${
                        error.includes("Planning Center")
                          ? "bg-theme-600 text-white border-theme-400 scale-[1.02] shadow-theme-500/40 ring-4 ring-theme-500/20"
                          : "bg-theme-600 hover:bg-theme-500 text-white border-theme-500/20 shadow-theme-500/10"
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-1 opacity-80" />
                      <span>Login with {provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
