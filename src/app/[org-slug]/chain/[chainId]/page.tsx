import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThumbnailLightbox from "@/components/ThumbnailLightbox";
import PrayerChainSchedule from "@/components/PrayerChainSchedule";
import TopNav from "@/components/TopNav";

export const revalidate = 0; // Dynamic data for signups

export default async function PrayerChainPage({
  params,
}: {
  params: Promise<{ "org-slug": string; chainId: string }>;
}) {
  const { "org-slug": orgSlug, chainId } = await params;

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) notFound();

  const chain = await prisma.prayerChain.findUnique({
    where: { id: chainId, organizationId: organization.id },
    include: {
      signups: {
        select: {
          startTime: true,
          name: true,
        },
      },
    },
  });

  if (!chain) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-10 text-center space-y-4 max-w-lg">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">
            No Active Prayer Chain
          </h2>
          <p className="text-[--color-text-muted]">
            This prayer chain could not be found or is no longer active.
          </p>
          <Link href={`/${orgSlug}/chain`}>
            <button className="btn-secondary mt-4 hover:border-theme-500/50">Return to Available Chains</button>
          </Link>
        </div>
      </main>
    )
  }

  // Signups are now directly on the chain object
  const signupsData = chain.signups;

  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { lightLogoUrl: true, darkLogoUrl: true },
  });

  return (
    <main className="min-h-screen relative p-4 sm:p-12 overflow-x-hidden">
      <div className="max-w-5xl mx-auto z-10 relative">
        {/* Logo row: logo on left, Manage My Prayers on right */}
        <div className="mb-6 flex items-center justify-between">
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
            href="/my-signups"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-theme-500/50 text-theme-500 hover:bg-theme-500/10 dark:bg-theme-500 dark:text-white dark:border-theme-500 dark:hover:bg-theme-600 transition-all font-semibold text-xs sm:text-sm shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Manage My Prayers
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-6 mb-12">
          {/* Left Side: Back nav + Info */}
          <div className="flex flex-col justify-between items-start order-last sm:order-first">
            <Link 
              href={`/${orgSlug}`} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:border-[--color-text-muted]/40 transition-all text-xs sm:text-sm font-medium mb-4"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {organization.name}
            </Link>

            <div className="mt-2 text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[--color-text-base] mb-2 drop-shadow-md relative">
                {chain.title}
              </h1>
              <p className="text-[--color-text-muted] text-xl max-w-2xl whitespace-pre-wrap">
                {chain.description ? chain.description : (
                  `Choose a time to commit to praying alongside ${organization.name}. Even small gaps filled with faithfulness bring huge momentum.`
                )}
              </p>
            </div>
          </div>
          
          {/* Right Side: Banner / Thumbnail */}
          {chain.thumbnailUrl && (
            <div className="flex-shrink-0 w-full sm:w-1/3 max-w-sm lg:max-w-md flex justify-start sm:justify-end py-1 items-start order-first sm:order-last">
              <ThumbnailLightbox src={chain.thumbnailUrl} alt={chain.title} />
            </div>
          )}
        </div>


        <PrayerChainSchedule chain={chain} signups={signupsData} />
      </div>
    </main>
  );
}
