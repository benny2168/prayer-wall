"use client";

import { signIn } from "next-auth/react";
import * as motion from "framer-motion/client";
import { useState } from "react";

export default function SignInButtons({
  providers,
}: {
  providers: { id: string; name: string; type: string }[];
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocal, setShowLocal] = useState(false);

  const oauthProviders = providers.filter((p) => p.type === "oauth");

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });
    if (res?.error) {
      setError("Invalid username or password.");
      setLoading(false);
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="space-y-4">
      {/* PCO OAuth Buttons */}
      {oauthProviders.map((provider) => (
        <motion.button
          key={provider.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn(provider.id, { callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-theme-600 hover:bg-theme-500 border border-theme-500 text-[--color-text-base] rounded-xl font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13v6l5 3-.75 1.3L10 14V7h1z" />
          </svg>
          <span>Sign in with {provider.name}</span>
        </motion.button>
      ))}

      {/* Local Admin Fallback */}
      <div className="pt-2">
        <button
          onClick={() => setShowLocal((v) => !v)}
          className="w-full text-xs text-[--color-text-muted] opacity-70 hover:opacity-100 transition-opacity py-1"
        >
          {showLocal ? "▲ Hide" : "▼ Local admin login"}
        </button>

        {showLocal && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleLocalLogin}
            className="mt-3 space-y-3 text-left"
          >
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[--color-bg-panel] border border-[--color-border-base] rounded-lg px-4 py-3 text-[--color-text-base] placeholder-[--color-text-muted] focus:outline-none focus:border-theme-500 focus:ring-1 focus:ring-theme-500 transition-all"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[--color-bg-panel] border border-[--color-border-base] rounded-lg px-4 py-3 text-[--color-text-base] placeholder-[--color-text-muted] focus:outline-none focus:border-theme-500 focus:ring-1 focus:ring-theme-500 transition-all"
              required
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-theme-500 text-[--color-primary-contrast] hover:bg-theme-600 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign in Locally"}
            </motion.button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
