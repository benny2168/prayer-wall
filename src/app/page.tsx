import { prisma } from "@/lib/prisma";
import Link from "next/link";
import * as motion from "framer-motion/client";
import Image from "next/image";
import TopNav from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [organizations, siteSettings] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.siteSettings.findUnique({ where: { id: "default" } })
  ]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 sm:pt-20 p-6 sm:p-16 relative overflow-hidden">
      <TopNav />
      <div className="z-10 max-w-5xl w-full flex flex-col items-center text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {(siteSettings?.lightLogoUrl || siteSettings?.darkLogoUrl) && (
            <div className="relative w-48 h-32 sm:w-64 sm:h-40 mb-4 sm:mb-8">
              {siteSettings?.lightLogoUrl && (
                <Image
                  src={siteSettings.lightLogoUrl}
                  alt="Site Logo"
                  fill
                  sizes="(max-width: 640px) 12rem, 16rem"
                  className="object-contain dark:hidden"
                  priority
                />
              )}
              {siteSettings?.darkLogoUrl && (
                <Image
                  src={siteSettings.darkLogoUrl}
                  alt="Site Logo"
                  fill
                  sizes="(max-width: 640px) 12rem, 16rem"
                  className={`object-contain ${siteSettings?.lightLogoUrl ? 'hidden dark:block' : ''}`}
                  priority
                />
              )}
            </div>
          )}

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-theme-400 to-theme-500 mb-6 drop-shadow-md">
            Prayer Wall
          </h1>
          <p className="text-lg sm:text-2xl text-[--color-text-muted] max-w-2xl mx-auto leading-relaxed">
            {siteSettings?.homePageText || "A safe space to share burdens, request intercession, and lift each other up in prayer."}
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {organizations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {organizations.map((org: any, index: number) => (
                <Link key={org.id} href={`/${org.slug}`}>
                  <motion.div
                    className="glass-card p-6 flex flex-col items-center justify-center text-center h-full group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <h2 className="text-2xl font-bold text-[--color-text-base] group-hover:text-primary transition-colors">
                      {org.name}
                    </h2>
                    <p className="text-[--color-text-muted] mt-2 text-sm">View Prayer Wall</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-10 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[--color-bg-panel]/50 flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-[--color-text-muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[--color-text-base]">No organizations found</h2>
              <p className="text-[--color-text-muted]">
                It looks like no organizations have been set up yet. If you are an admin, please visit the dashboard to get started.
              </p>
              <Link href="/admin">
                <button className="btn-primary mt-4">Go to Admin Portal</button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
      <div className="absolute bottom-6 w-full flex justify-center">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[--color-glass-border] text-[--color-text-muted] hover:text-[--color-text-base] hover:border-[--color-text-muted]/40 transition-all text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin Login
        </Link>
      </div>
    </main>
  );
}
