"use client";

import { signIn } from "next-auth/react";
import * as motion from "framer-motion/client";

export default function SignInButtons({ providers }: { providers: Record<string, any> | null }) {
  if (!providers) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-left">
        <strong>Auth Configuration Error</strong>
        <p className="mt-1">Authentication providers failed to load. Please verify your NEXTAUTH_URL and OAuth credentials in the .env file.</p>
      </div>
    );
  }

  const oauthProviders = Object.values(providers).filter((p) => p.type === "oauth");

  return (
    <div className="space-y-4">
      {oauthProviders.map((provider) => (
        <motion.button
          key={provider.name}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn(provider.id, { callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-theme-600 hover:bg-theme-500 border border-theme-500 text-[--color-text-base] rounded-xl font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13v6l5 3-.75 1.3L10 14V7h1z"/>
          </svg>
          <span>Sign in with {provider.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
