import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ThumbnailLightbox from "@/components/ThumbnailLightbox";
import PrayerChainSchedule from "@/components/PrayerChainSchedule";
import PrayerChainDetailClient from "@/components/PrayerChainDetailClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 0; // Dynamic data for signups

export default async function PrayerChainPage({
  params,
}: {
  params: Promise<{ "org-slug": string; chainId: string }>;
}) {
  const { "org-slug": orgSlug, chainId } = await params;
  const session = await getServerSession(authOptions);

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) notFound();

  const chain = await prisma.prayerChain.findUnique({
    where: { id: chainId, organizationId: organization.id },
    include: {
      signups: {
        select: {
          id: true,
          startTime: true,
          name: true,
          email: true,
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
    );
  }

  // Signups are now directly on the chain object
  const signupsData = chain.signups;

  const siteSettings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { lightLogoUrl: true, darkLogoUrl: true },
  });

  return (
    <PrayerChainDetailClient 
      organization={organization}
      chain={chain as any}
      signups={signupsData as any}
      siteSettings={siteSettings}
      orgSlug={orgSlug}
      user={session?.user}
    />
  );
}
