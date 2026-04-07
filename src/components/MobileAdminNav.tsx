"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "next-auth";
import { LayoutDashboard, Church, HandHeart, Link2, Palette, Menu, X, LogOut, User, Mail, Users } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface AuthUser {
  id: string;
  role: string;
  isLocalAdmin?: boolean;
}

export default function MobileAdminNav({ 
  session,
  siteSettings 
}: { 
  session: Session & { user?: AuthUser } | null,
  siteSettings: any 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/organizations", label: "Organizations", icon: Church },
    { href: "/admin/prayers", label: "Prayers", icon: HandHeart },
    { href: "/admin/chains", label: "Prayer Chains", icon: Link2 },
    { href: "/admin/reminders", label: "Email Audits", icon: Mail },
    { href: "/admin/my-portal", label: "My Activity", icon: User },
  ];

  if (session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin) {
    links.push({ href: "/admin/members", label: "Members", icon: Users });
    links.push({ href: "/admin/theme", label: "Theme", icon: Palette });
  }

  const siteTitle = "Prayer Wall";

  return (
    <div className="lg:hidden flex flex-col w-full z-50">
      {/* Mobile Top Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[--color-bg-panel] border-b border-[--color-border-base] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {(siteSettings?.lightLogoUrl || siteSettings?.darkLogoUrl) ? (
            <div className="relative h-8 w-28 sm:w-40">
                {siteSettings?.lightLogoUrl && (
                  <Image
                    src={siteSettings.lightLogoUrl}
                    alt="Site Logo"
                    fill
                    className="object-contain object-left logo-light"
                  />
                )}
                {siteSettings?.darkLogoUrl && (
                  <Image
                    src={siteSettings.darkLogoUrl}
                    alt="Site Logo"
                    fill
                    className="object-contain object-left logo-dark"
                  />
                )}
              </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-theme-600 flex items-center justify-center overflow-hidden shrink-0">
                <HandHeart className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif font-semibold text-[--color-text-base] truncate">{siteTitle}</span>
            </>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-[--color-text-base] hover:bg-[--color-bg-base]/50 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={closeMenu}
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-[60px] left-0 right-0 bg-[--color-bg-panel] border-b border-[--color-border-base] p-4 space-y-1 shadow-2xl"
            >
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-theme-500/20 text-theme-500 shadow-sm" 
                        : "text-[--color-text-muted] hover:bg-[--color-bg-base]/50 hover:text-[--color-text-base]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-4 mt-2 border-t border-[--color-border-base]">
                <Link
                  href="/api/auth/signout?callbackUrl=/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
