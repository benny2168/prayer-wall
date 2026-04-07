"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, HandHeart, Link2, Search, ShieldCheck, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import PrayerForm from "@/components/PrayerForm";
import PrayButton from "@/components/PrayButton";
import DarkModeToggle from "@/components/DarkModeToggle";
import GlobalHeader from "@/components/GlobalHeader";

// Types
type Organization = {
  id: string;
  slug: string;
  name: string;
  bannerUrl: string | null;
};

type Prayer = {
  id: string;
  text: string;
  name: string | null;
  email: string | null;
  notify_if_prayed: boolean;
  prayer_count: number;
  isPublic: boolean;
  createdAt: Date | string;
};

type Chain = {
  id: string;
  title: string;
  start_time: string | Date;
  end_time: string | Date;
};

type SiteSettings = {
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
};

export default function OrganizationWallClient({
  organization: org,
  prayers,
  chains,
  siteSettings,
}: {
  organization: Organization;
  prayers: Prayer[];
  chains: Chain[];
  siteSettings: SiteSettings | null;
}) {
  const [search, setSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "GLOBAL_ADMIN" || (session?.user as any)?.isLocalAdmin;
  const isLoggedIn = !!session?.user;
  const portalLabel = isAdmin ? "Admin Portal" : "Member Portal";
  const portalHref = isAdmin ? "/admin" : "/my-signups";
  const PortalIcon = isAdmin ? Shield : ShieldCheck;

  const now = new Date();
  const activeChains = chains.filter(c => {
    const start = new Date(c.start_time);
    const end = new Date(c.end_time);
    return now >= start && now <= end;
  });

  useEffect(() => {
    const onScroll = () => {
      const heroH = heroRef.current?.offsetHeight ?? 200;
      setScrolled(window.scrollY > (heroH - 50));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredPrayers = prayers.filter(p => 
    p.text.toLowerCase().includes(search.toLowerCase()) || 
    (p.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const LogoRenderer = ({ className = "" }: { className?: string }) => {
    if (siteSettings?.darkLogoUrl || siteSettings?.lightLogoUrl) {
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
           {siteSettings.lightLogoUrl && (
             <img src={siteSettings.lightLogoUrl} alt="Logo" className="w-auto h-full max-h-full object-contain dark:hidden" />
           )}
           {siteSettings.darkLogoUrl && (
             <img src={siteSettings.darkLogoUrl} alt="Logo" className={`w-auto h-full max-h-full object-contain ${siteSettings.lightLogoUrl ? 'hidden dark:block' : ''}`} />
           )}
        </div>
      );
    }
    return <HandHeart className={`w-8 h-8 text-theme-500 ${className}`} />;
  };

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {/* Universal Global Header — handles both expansion and scroll states */}
      <GlobalHeader 
        siteSettings={siteSettings} 
        scrolled={scrolled}
        transparent={!scrolled}
        leftContent={scrolled && (
          <div className="flex items-center gap-2 ml-4">
            <h1 className="font-serif font-bold text-sm hidden md:block truncate max-w-[200px] text-[--color-text-base]">{org.name}</h1>
          </div>
        )}
        centerContent={scrolled && (
          <div className="flex-1 relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
            <input
              placeholder="Search prayers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-[--color-glass-border] focus:bg-[--color-bg-base] text-sm outline-none transition-all text-[--color-text-base]"
            />
          </div>
        )}
        rightContent={scrolled && (
          <button 
            onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
            className="text-xs font-semibold px-3 py-1.5 bg-theme-600 hover:bg-theme-500 text-white rounded-full transition-colors hidden sm:block mr-2"
          >
            Share Request
          </button>
        )}
      />

      {/* Expanded Hero Header */}
      <header ref={heroRef} className="relative overflow-hidden transition-opacity duration-300">
        {/* Mobile background banner */}
        {org.bannerUrl && (
          <div className="sm:hidden absolute inset-0 z-0">
            <img src={org.bannerUrl} alt={org.name} className="w-full h-full object-cover scale-105 blur-md opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[--color-bg-base] via-[--color-bg-base]/80 to-theme-900/50 dark:to-black/50" />
          </div>
        )}
        
        {/* Desktop gradient sweep — bounded, fades to transparent */}
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] bg-gradient-to-b from-theme-500/20 via-theme-500/10 to-transparent hidden sm:block z-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="px-4 sm:px-6 pt-24 sm:pt-32 pb-10 sm:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10"
            >
              <div className="flex-1 text-center sm:text-left">
                {/* 1. Back link moved ABOVE the title */}
                <div className="mb-6">
                  <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    All Organizations
                  </Link>
                </div>
                
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-sm text-[--color-text-title]">
                  {org.name}
                </h1>

                {/* 2. Subtitle moved BELOW the title */}
                <div className="flex items-center justify-center sm:justify-start gap-4 mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme]">
                    PUBLIC PRAYER WALL
                  </span>
                </div>
                
                <p className="max-w-xl text-lg leading-relaxed text-[--color-text-muted]">
                  A safe space to share burdens, request intercession, and lift each other up in prayer.
                </p>
              </div>
            
              {/* Desktop Side Banner Image */}
              {org.bannerUrl && (
                <div className="hidden sm:block shrink-0 relative w-64 h-40 lg:w-80 lg:h-48 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
                  <img src={org.bannerUrl} alt={org.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Chains Banner — only if there is an ACTIVE chain today */}
      {activeChains.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-6 mb-8">
          <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-theme-600 shadow-[0_0_15px_rgba(var(--theme-600),0.5)]" />
            <div className="flex items-center gap-4 pl-2">
              <div className="w-12 h-12 rounded-2xl bg-theme-500/10 flex items-center justify-center shrink-0 border border-theme-500/30">
                <Link2 className="w-6 h-6 text-theme-500" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[--color-text-title]">Active Prayer Chains</h3>
                <p className="text-sm text-[--color-text-muted] font-medium">{activeChains.length} specialized chain{activeChains.length > 1 ? "s" : ""} scheduling intercession today</p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap sm:ml-auto">
              {activeChains.map((c) => (
                <Link key={c.id} href={`/${org.slug}/chain/${c.id}`}>
                  <button className="btn-secondary !py-2.5 !px-6 text-sm font-bold shadow-theme-500/10">
                    {c.title}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-32 pt-4">
        {/* Action Row: Evenly distributed buttons and filter */}
        <div className="flex flex-row items-center justify-between gap-6 mb-12 w-full">
           <div className="flex flex-row items-center gap-4">
              <PrayerForm orgId={org.id} orgSlug={org.slug} chains={chains} />
           </div>

           <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
              <input
                placeholder="Filter exactly..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[--color-bg-panel] border border-[--color-glass-border] shadow-sm rounded-full focus:ring-2 focus:ring-theme-500 focus:border-theme-500 text-[--color-text-base] transition-all outline-none"
              />
           </div>
        </div>

        {filteredPrayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            <AnimatePresence>
              {filteredPrayers.map((prayer, i) => (
                <motion.div 
                  key={prayer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: (i % 6) * 0.05 }}
                  className="bg-[--color-bg-panel]/80 backdrop-blur-xl border border-[--color-glass-border] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full group"
                >
                  <div className="p-7">
                    <p className="text-[--color-text-base] text-lg leading-relaxed whitespace-pre-wrap font-serif italic font-medium">
                      "{prayer.text}"
                    </p>
                    <div className="mt-8 flex items-center justify-between">
                      <p className="text-[--color-text-muted] text-xs font-semibold uppercase tracking-wider">
                        {prayer.name || "Anonymous"} 
                      </p>
                      <span className="text-[--color-text-muted] text-xs font-medium bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-[--color-glass-border]">
                        {new Date(prayer.createdAt).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-[--color-glass-border] bg-black/[0.02] dark:bg-white/[0.02] px-7 py-4">
                     <PrayButton prayerId={prayer.id} initialCount={prayer.prayer_count} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-[--color-bg-panel]/50 border border-[--color-glass-border] rounded-3xl p-16 flex flex-col items-center justify-center text-center mt-8">
            <div className="w-20 h-20 rounded-full bg-theme-500/10 flex items-center justify-center mb-6">
              <HandHeart className="w-10 h-10 text-theme-500" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-[--color-text-base] mb-3">No Prayers Found</h3>
            <p className="text-[--color-text-muted] max-w-sm">
              {search ? "No prayers match your search query. Try typing something else!" : "Be the first to share a prayer request with the community on this wall."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
