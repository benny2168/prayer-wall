import Link from "next/link";
import Image from "next/image";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import MobileAdminNav from "./MobileAdminNav";

interface AuthUser {
  id: string;
  role: string;
  isLocalAdmin?: boolean;
}

export default async function AdminNav() {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser } | null;

  return (
    <>
      <MobileAdminNav session={session} />
      <aside className="w-64 bg-[--color-bg-panel] border-r border-[--color-border-base] hidden md:flex flex-col min-h-screen">
        <div className="p-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-theme-400 to-theme-600">
          Admin Portal
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <Link href="/admin" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg-base] hover:text-[--color-text-base] transition-colors">
          <span>📊</span>
          <span>Dashboard</span>
        </Link>
        <Link href="/admin/organizations" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg-base] hover:text-[--color-text-base] transition-colors">
          <span>🏢</span>
          <span>Organizations</span>
        </Link>
        <Link href="/admin/prayers" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg-base] hover:text-[--color-text-base] transition-colors">
          <span>🙏</span>
          <span>Prayers</span>
        </Link>
        <Link href="/admin/chains" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg-base] hover:text-[--color-text-base] transition-colors">
          <span>⛓️</span>
          <span>Prayer Chains</span>
        </Link>
        {(session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin) && (
          <Link href="/admin/settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg-base] hover:text-[--color-text-base] transition-colors">
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-[--color-border-base]">
        <div className="flex items-center space-x-3 px-3 py-2">
          {session?.user?.image ? (
            <Image 
              src={session.user.image} 
              alt="Avatar" 
              width={32}
              height={32}
              className="w-8 h-8 rounded-full" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[--color-border-base] flex items-center justify-center">👤</div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-[--color-text-base] truncate">{session?.user?.name || "Admin"}</p>
            <p className="text-xs text-[--color-text-muted] truncate">{session?.user?.email}</p>
          </div>
        </div>
        <Link 
          href="/api/auth/signout?callbackUrl=/admin/login" 
          className="mt-2 block w-full text-center text-xs text-red-500 hover:text-red-600 py-2 transition-colors"
        >
          Sign Out
        </Link>
      </div>
    </aside>
    </>
  );
}
