"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { LayoutDashboard, Church, HandHeart, Link2, Palette, ChevronDown, LogOut, User, Mail, Users } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";

interface AuthUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isLocalAdmin?: boolean;
}

export default function DesktopAdminNav({ 
  session, 
  siteSettings 
}: { 
  session: Session & { user?: AuthUser } | null,
  siteSettings: any 
}) {
  const pathname = usePathname();

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
    <aside className="hidden lg:flex flex-col w-64 border-r border-[--color-border-base] bg-[--color-glass] backdrop-blur-2xl fixed inset-y-0 left-0 z-30">
      <div className="p-6 border-b border-[--color-border-base]">
        <Link href="/" className="flex items-center justify-center py-2">
          {(siteSettings?.lightLogoUrl || siteSettings?.darkLogoUrl) ? (
             <div className="relative h-14 w-full">
                {siteSettings?.lightLogoUrl && (
                  <Image
                    src={siteSettings.lightLogoUrl}
                    alt="Site Logo"
                    fill
                    className="object-contain object-center logo-light"
                  />
                )}
                {siteSettings?.darkLogoUrl && (
                  <Image
                    src={siteSettings.darkLogoUrl}
                    alt="Site Logo"
                    fill
                    className="object-contain object-center logo-dark"
                  />
                )}
              </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-xl bg-theme-600 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-theme-500/20">
                <HandHeart className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-serif text-xl font-bold text-[--color-text-base] truncate leading-tight">{siteTitle}</h1>
                <p className="text-[0.65rem] font-bold text-theme-500 tracking-widest uppercase">Admin Portal</p>
              </div>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                isActive
                  ? "bg-theme-500/20 text-theme-500 shadow-sm ring-1 ring-theme-500/30"
                  : "text-[--color-text-muted] hover:text-[--color-text-base] hover:bg-theme-500/5"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[--color-border-base]">
        <Link href="/api/auth/signout?callbackUrl=/login" className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[--color-bg-base]/50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-theme-500/20 flex items-center justify-center text-sm font-semibold text-theme-500 shrink-0 overflow-hidden relative">
            {session?.user?.image ? (
              <Image 
                src={session.user.image} 
                alt="" 
                fill
                unoptimized={session.user.image.includes('planningcenteronline')}
                className="object-cover" 
              />
            ) : (
              <span>{session?.user?.name?.[0] || "A"}</span>
            )}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-medium text-[--color-text-base] truncate">{session?.user?.name || "Admin"}</p>
            <p className="text-xs text-[--color-text-muted] truncate">{session?.user?.email}</p>
          </div>
          <LogOut className="w-4 h-4 text-[--color-text-muted] group-hover:text-red-500 transition-colors" />
        </Link>
      </div>
    </aside>
  );
}
