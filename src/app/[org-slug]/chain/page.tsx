import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

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
    <main className="min-h-screen relative p-4 sm:p-12 overflow-x-hidden">
      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Logo row: logo on left (links home), back button on right */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {siteSettings?.lightLogoUrl && (
              <div className="relative h-10 w-32 dark:hidden">
                <Image 
                  src={siteSettings.lightLogoUrl} 
                  alt="Site Logo" 
                  fill
                  sizes="128px"
                  className="object-contain drop-shadow-md object-left" 
                />
              </div>
            )}
            {siteSettings?.darkLogoUrl && (
              <div className={`relative h-10 w-32 ${siteSettings?.lightLogoUrl ? 'hidden dark:block' : ''}`}>
                <Image 
                  src={siteSettings.darkLogoUrl} 
                  alt="Site Logo" 
                  fill
                  sizes="128px"
                  className="object-contain drop-shadow-md object-left" 
                />
              </div>
            )}
          </Link>
          <Link
            href={`/${orgSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:border-[--color-text-muted]/40 transition-all text-xs sm:text-sm font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {organization.name}
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[--color-text-base] mb-2 shadow-sm drop-shadow-md">
            Prayer Chains
          </h1>
          <p className="text-[--color-text-muted] text-lg">
            Choose an initiative to commit to praying alongside {organization.name}.
          </p>
        </div>

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
      </div>
    </main>
  );
}
