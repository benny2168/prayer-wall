"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import ThumbnailLightbox from "@/components/ThumbnailLightbox";
import PrayerChainSchedule from "@/components/PrayerChainSchedule";

type Organization = {
  id: string;
  slug: string;
  name: string;
};

type Chain = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  start_time: Date;
  end_time: Date;
  daily_start: string;
  daily_end: string;
  block_duration_mins: number;
  max_people_per_block: number;
};

type Signup = {
  id: string;
  startTime: Date;
  name: string;
  email: string | null;
};

type SiteSettings = {
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
};

export default function PrayerChainDetailClient({
  organization,
  chain,
  signups,
  siteSettings,
  orgSlug,
  user,
}: {
  organization: Organization;
  chain: Chain;
  signups: Signup[];
  siteSettings: SiteSettings | null;
  orgSlug: string;
  user?: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const heroH = heroRef.current?.offsetHeight ?? 300;
      setScrolled(window.scrollY > (heroH - 100));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {/* Universal Global Header — handles both expansion and scroll states */}
      <GlobalHeader 
        siteSettings={siteSettings} 
        scrolled={scrolled}
        transparent={!scrolled}
        leftContent={scrolled && (
          <div className="flex items-center gap-2 ml-4">
            <h1 className="font-serif font-bold text-sm hidden md:block truncate max-w-[200px] text-[--color-text-base]">{organization.name}</h1>
          </div>
        )}
        centerContent={scrolled && (
          <div className="text-center">
            <p className="text-xs font-bold text-[--color-text-theme] uppercase tracking-widest truncate max-w-[250px]">
              {chain.title}
            </p>
          </div>
        )}
      />

      {/* Hero */}
      <header ref={heroRef} className="relative overflow-hidden">
        {/* Gradient backdrop — matching parity with wall/home */}
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] bg-gradient-to-b from-theme-500/20 via-theme-500/10 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Spacer to align with GlobalHeader's expanded state */}
          <div className="h-24 sm:h-32" />

          <div className="px-6 pb-16 sm:pb-20">
            <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-8">
              {/* Left Side: Hierarchy unification (Back -> Title -> Desc) */}
              <div className="flex-1 text-center sm:text-left">
                {/* 1. Back link moved ABOVE the title */}
                <div className="mb-6">
                  <Link 
                    href={`/${orgSlug}`} 
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {organization.name}
                  </Link>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-[--color-text-title] drop-shadow-sm">
                    {chain.title}
                  </h1>

                  <div className="flex items-center justify-center sm:justify-start gap-4 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-[--color-text-theme]">
                      PRAYER CHAIN SIGN UP
                    </span>
                  </div>
                  <p className="text-xl leading-relaxed text-[--color-text-muted] max-w-2xl whitespace-pre-wrap mx-auto sm:mx-0">
                    {chain.description ? chain.description : (
                      `Choose a time to commit to praying alongside ${organization.name}. Even small gaps filled with faithfulness bring huge momentum.`
                    )}
                  </p>
                </motion.div>
              </div>
              
              {/* Right Side: Thumbnail / Card */}
              {chain.thumbnailUrl && (
                <div className="flex-shrink-0 w-full sm:w-1/3 flex justify-center sm:justify-end items-start mt-4 sm:mt-0">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl"
                  >
                    <ThumbnailLightbox src={chain.thumbnailUrl} alt={chain.title} />
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <PrayerChainSchedule chain={chain} signups={signups as any} user={user} />
      </section>
    </div>
  );
}
