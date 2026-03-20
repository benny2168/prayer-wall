"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "next-auth";

interface AuthUser {
  id: string;
  role: string;
  isLocalAdmin?: boolean;
}

export default function MobileAdminNav({ session }: { session: Session & { user?: AuthUser } | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/organizations", label: "Organizations", icon: "🏢" },
    { href: "/admin/prayers", label: "Prayers", icon: "🙏" },
    { href: "/admin/chains", label: "Prayer Chains", icon: "⛓️" },
  ];

  if (session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin) {
    links.push({ href: "/admin/settings", label: "Settings", icon: "⚙️" });
  }

  return (
    <div className="md:hidden flex flex-col w-full z-50">
      {/* Mobile Top Header */}
      <div className="flex items-center justify-between p-4 bg-[--color-bg-panel] border-b border-[--color-border-base] w-full">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-400 to-theme-500 drop-shadow-sm">
          Admin Portal
        </h2>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 text-[--color-text-base] hover:text-theme-500 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Fullscreen Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-end"
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{ backgroundColor: "var(--color-bg-panel)" }}
              className="w-3/4 max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[--color-border-base]">
                <h3 className="text-lg font-bold text-[--color-text-base]">Menu</h3>
                <button 
                  onClick={closeMenu} 
                  className="p-2 text-[--color-text-base] opacity-70 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={closeMenu}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? "bg-theme-500/20 text-theme-500 font-bold shadow-sm" 
                          : "text-[--color-text-base] opacity-80 hover:bg-[--color-bg-base] hover:opacity-100"
                      }`}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[--color-border-base] bg-[--color-bg-base]/50">
                <div className="flex items-center space-x-3 mb-4">
                  {session?.user?.image ? (
                    <Image 
                      src={session.user.image} 
                      alt="Avatar" 
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border border-[--color-border-base]" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[--color-border-base] flex items-center justify-center text-lg">👤</div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold text-[--color-text-base] truncate">{session?.user?.name || "Admin"}</p>
                    <p className="text-xs text-[--color-text-base] opacity-70 truncate">{session?.user?.email}</p>
                  </div>
                </div>
                <Link 
                  href="/api/auth/signout?callbackUrl=/admin/login" 
                  className="block w-full text-center py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium text-sm"
                >
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
