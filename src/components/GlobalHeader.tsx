"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { HandHeart, Shield, Users, ShieldCheck } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";

type SiteSettings = {
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
};

export default function GlobalHeader({ 
  siteSettings, 
  scrolled = false,
  transparent = false,
  leftContent,
  centerContent,
  rightContent
}: { 
  siteSettings: SiteSettings | null; 
  scrolled?: boolean;
  transparent?: boolean;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "GLOBAL_ADMIN" || (session?.user as any)?.isLocalAdmin;
  const isLoggedIn = !!session?.user;

  const portalHref = isAdmin ? "/admin" : "/my-signups";
  const portalLabel = isAdmin ? "Admin Portal" : "Member Portal";
  const PortalIcon = isAdmin ? Shield : ShieldCheck;

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-[--color-bg-base]/80 backdrop-blur-xl border-b border-[--color-glass-border] py-3 sm:py-4" 
        : (transparent ? "bg-transparent py-6 sm:py-8" : "bg-[--color-bg-base] py-6 sm:py-8")
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between relative">
      {/* Site Logo - Consistency is key. Always in the top left. */}
        <div className="flex items-center gap-3 relative z-20 mt-2 sm:mt-0">
          <Link href="/" className="flex items-center">
            {(siteSettings?.lightLogoUrl || siteSettings?.darkLogoUrl) ? (
              <div className="relative h-12 w-48 sm:w-72">
                {siteSettings?.lightLogoUrl && (
                  <Image
                    src={siteSettings.lightLogoUrl}
                    alt="Site Logo"
                    fill
                    sizes="(max-width: 640px) 12rem, 18rem"
                    className="object-contain object-left logo-light"
                    priority
                  />
                )}
                {siteSettings?.darkLogoUrl && (
                  <Image
                    src={siteSettings.darkLogoUrl}
                    alt="Site Logo"
                    fill
                    sizes="(max-width: 640px) 12rem, 18rem"
                    className="object-contain object-left logo-dark"
                    priority
                  />
                )}
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-theme-600 flex items-center justify-center overflow-hidden">
                  <HandHeart className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-xl font-semibold text-[--color-text-base]">Prayer Wall</span>
              </>
            )}
          </Link>
          {leftContent}
        </div>

          {/* Center: Content override or identity */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center hidden md:block">
            {centerContent ? centerContent : (
              isLoggedIn && (
                <p className="text-xs text-[--color-text-muted] font-medium whitespace-nowrap">
                  Logged in as{" "}
                  <span className="text-[--color-text-base] font-bold">{session?.user?.name || session?.user?.email}</span>
                </p>
              )
            )}
          </div>

          {/* Right: Portal + Dark Mode + custom content */}
          <div className="relative z-30 ml-auto flex items-center gap-1 sm:gap-2">
            {rightContent}
            {isLoggedIn ? (
              <Link
                href={portalHref}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-[--color-text-base] hover:bg-white/10 dark:hover:bg-white/5 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-theme-500" />
                <span className="hidden sm:inline">{portalLabel}</span>
              </Link>
            ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm text-[--color-text-base] hover:bg-[--color-bg-panel]/50 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}
        <DarkModeToggle />
      </div>
    </div>
  </nav>
  );
}
