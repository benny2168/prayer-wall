import { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[--color-bg-base] text-[--color-text-base] selection:bg-theme-500/30">
      <AdminNav />
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen relative lg:ml-64 pt-20 lg:pt-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-theme-500/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-theme-500/5 blur-[100px]" />
        </div>
        <div className="h-full relative z-10 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
