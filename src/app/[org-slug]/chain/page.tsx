import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

export const dynamic = "force-dynamic";

export default async function ChainListPage({
  params,
}: {
  params: Promise<{ "org-slug": string }>;
}) {
  const orgSlug = (await params)["org-slug"];

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      chains: {
        where: {
          isActive: true,
          isPublic: true,
        },
        orderBy: {
          start_time: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          start_time: true,
          end_time: true,
        }
      },
    },
  });

  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { lightLogoUrl: true, darkLogoUrl: true },
  });

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[--color-bg-base]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Gradient backdrop — ends before the cards */}
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] bg-gradient-to-b from-theme-500/20 via-theme-500/10 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[480px] sm:h-[520px] opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="relative max-w-3xl mx-auto px-6 pt-24 sm:pt-32 pb-16 sm:pb-20 text-center">
            {/* 1. Back link moved ABOVE the title */}
            <div className="mb-8">
              <Link
                href={`/${orgSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] transition-colors"
                >
                <ArrowLeft className="w-4 h-4" />
                Back to {organization.name}
              </Link>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-[--color-text-base]">
              Prayer Chains
            </h1>
            <p className="text-lg text-[--color-text-muted] max-w-xl mx-auto leading-relaxed">
              Choose an initiative to commit to praying alongside {organization.name}.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10">

        {organization.chains.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {organization.chains.map((chain: any) => (
              <Link 
                key={chain.id} 
                href={`/${orgSlug}/chain/${chain.id}`}
                className="group"
              >
                <div className="glass-card p-6 transition-all duration-300 group-hover:bg-[--color-bg-panel]/80 group-hover:border-theme-500/50">
                  <div className="flex flex-col md:flex-row gap-6">
                    {chain.thumbnailUrl && (
                      <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden border border-[--color-border-base] shrink-0">
                        <img src={chain.thumbnailUrl} alt={chain.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[--color-text-base] group-hover:text-theme-400 transition-colors">
                            {chain.title}
                          </h2>
                          {chain.description && (
                            <p className="text-[--color-text-muted] mt-2 line-clamp-2">
                              {chain.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-4 text-sm text-[--color-text-muted]">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(chain.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(chain.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button className="btn-primary py-2 px-6">
                            Join Chain
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center mt-12 bg-[--color-bg-panel]/30">
            <div className="w-16 h-16 rounded-full bg-[--color-bg-panel]/50 flex items-center justify-center mb-4">
              <span className="text-3xl">🙏</span>
            </div>
            <h3 className="text-xl font-medium text-[--color-text-base] mb-2">No active chains</h3>
            <p className="text-[--color-text-muted]">Check back soon for upcoming prayer initiatives.</p>
          </div>
        )}
      </section>
    </div>
  );
}
