import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PrayerForm from "@/components/PrayerForm";
import PrayButton from "@/components/PrayButton";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default async function OrganizationWall({
  params,
}: {
  params: Promise<{ "org-slug": string }>;
}) {
  const orgSlug = (await params)["org-slug"];

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      prayers: {
        where: {
          isPublic: true,
          isArchived: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      chains: {
        where: {
          isActive: true,
          isPublic: true,
        },
        select: {
          id: true,
        },
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
      <div className="max-w-5xl mx-auto z-10 relative">
        
        {/* Logo row: logo on left, Manage My Prayers on right */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {siteSettings?.lightLogoUrl && (
              <div className="relative h-12 w-40 dark:hidden">
                <Image 
                  src={siteSettings.lightLogoUrl} 
                  alt="Site Logo" 
                  fill
                  sizes="160px"
                  className="object-contain object-left drop-shadow-md" 
                />
              </div>
            )}
            {siteSettings?.darkLogoUrl && (
              <div className={`relative h-12 w-40 ${siteSettings?.lightLogoUrl ? 'hidden dark:block' : ''}`}>
                <Image 
                  src={siteSettings.darkLogoUrl} 
                  alt="Site Logo" 
                  fill
                  sizes="160px"
                  className="object-contain object-left drop-shadow-md" 
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
              href="/" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:border-[--color-text-muted]/40 transition-all text-xs sm:text-sm font-medium mb-4"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Organizations
            </Link>

            <div className="mt-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[--color-text-base] mb-2 drop-shadow-md relative">
                {organization.name}
              </h1>
              <p className="text-[--color-text-muted] text-lg font-medium">Public Prayer Wall</p>
            </div>
          </div>
          
          {/* Right Side: Banner */}
          {organization.bannerUrl && (
            <div className="flex-shrink-0 flex items-stretch py-1 w-full sm:w-auto sm:max-w-md lg:max-w-lg order-first sm:order-last">
              <img 
                src={organization.bannerUrl} 
                alt={`${organization.name} Banner`} 
                className="w-full h-auto sm:w-auto sm:h-full object-contain sm:object-right rounded-xl shadow-lg"
              />
            </div>
          )}
        </div>

        <PrayerForm 
          orgId={organization.id} 
          orgSlug={orgSlug}
          chains={organization.chains}
        />

        {/* Member Portal Button removed — now in TopNav */}
        
        {organization.prayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
            {organization.prayers.map((prayer: any) => (
              <div 
                key={prayer.id} 
                className="glass-card flex flex-col justify-between h-full group"
              >
                <div className="p-6">
                  <p className="text-slate-100 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    "{prayer.text}"
                  </p>
                  <p className="text-[--color-text-muted] mt-6 text-sm font-medium">
                    – {prayer.name || "Anonymous"} 
                    <span className="text-[--color-text-muted] ml-2 text-xs font-normal">
                      {new Date(prayer.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </p>
                </div>
                
                <PrayButton prayerId={prayer.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-center mt-12 bg-[--color-bg-panel]/30">
            <div className="w-16 h-16 rounded-full bg-[--color-bg-panel]/50 flex items-center justify-center mb-4">
              <span className="text-3xl">🕊️</span>
            </div>
            <h3 className="text-xl font-medium text-[--color-text-base] mb-2">The wall is currently empty</h3>
            <p className="text-[--color-text-muted]">Be the first to share a prayer request with the community.</p>
          </div>
        )}
      </div>
    </main>
  );
}
