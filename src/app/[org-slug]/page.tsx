import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PrayerForm from "@/components/PrayerForm";
import PrayButton from "@/components/PrayButton";
import TopNav from "@/components/TopNav";
import OrganizationWallClient from "./OrganizationWallClient";

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
          title: true,
          start_time: true,
          end_time: true,
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
    <OrganizationWallClient
      organization={{
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
        bannerUrl: organization.bannerUrl,
      }}
      prayers={organization.prayers}
      chains={organization.chains}
      siteSettings={siteSettings}
    />
  );
}
