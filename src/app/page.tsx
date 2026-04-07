import { prisma } from "@/lib/prisma";
import Link from "next/link";
import * as motion from "framer-motion/client";
import Image from "next/image";
import GlobalHeader from "@/components/GlobalHeader";
import { Church, HandHeart, ArrowRight, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [organizations, siteSettings] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.siteSettings.findUnique({ where: { id: "default" } })
  ]);

  const siteTagline = "LIFTING EACH OTHER UP";
  const siteSubtitle = "MTCD Carrollton Prayer Wall";

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Gradient backdrop — ends before the cards */}
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] bg-gradient-to-b from-theme-500/20 via-theme-500/10 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <GlobalHeader siteSettings={siteSettings ? { lightLogoUrl: siteSettings.lightLogoUrl, darkLogoUrl: siteSettings.darkLogoUrl } : null} transparent={true} />

        <div className="relative max-w-3xl mx-auto px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-theme-500 tracking-wider uppercase mb-4">
              {siteTagline}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-[--color-text-base]">
              {siteSubtitle}
            </h1>
            <p className="text-lg text-[--color-text-muted] max-w-xl mx-auto leading-relaxed">
              {siteSettings?.homePageText || "A space to share burdens, request intercession, and lift each other up in prayer."}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Organizations */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.length > 0 ? organizations.map((org: any, i: number) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link
                href={`/${org.slug}`}
                className="group block glass-card p-6"
              >
                {org.bannerUrl ? (
                  <div className="relative w-full h-40 mb-4 rounded-xl overflow-hidden bg-white/5">
                    <Image
                      src={org.bannerUrl}
                      alt={org.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-gradient-to-br from-theme-500/10 to-theme-300/10 flex items-center justify-center mb-4 border border-[--color-glass-border]">
                    <Church className="w-10 h-10 text-theme-500/40" />
                  </div>
                )}
                <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-theme-500 transition-colors text-[--color-text-base]">
                  {org.name}
                </h3>
                <p className="text-sm text-[--color-text-muted] line-clamp-2 mb-4 h-10 overflow-hidden">
                  Building hope through faith, love, and prayer. Every prayer matters, every voice is heard.
                </p>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <span className="flex items-center gap-1.5 text-theme-500 font-medium">
                    <HandHeart className="w-4 h-4" />
                    Prayer Wall
                  </span>
                  <span className="flex items-center gap-1.5 text-[--color-text-muted] transition-colors group-hover:text-[--color-text-base]">
                    <Link2 className="w-4 h-4" />
                    Prayer Chains
                  </span>
                  <ArrowRight className="w-4 h-4 text-[--color-text-muted] ml-auto group-hover:text-theme-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-16">
              <Church className="w-12 h-12 text-[--color-text-muted]/30 mx-auto mb-4" />
              <h3 className="font-serif text-xl font-semibold mb-2 text-[--color-text-base]">No Organizations Yet</h3>
              <p className="text-[--color-text-muted] mb-6">Get started by creating an organization in the admin portal.</p>
              <Link href="/admin/organizations">
                <button className="btn-primary">Go to Admin</button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
