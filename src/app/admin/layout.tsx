import { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Mobile header could be added here
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[--color-bg-base] text-[--color-text-base]">
      <AdminNav />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full relative z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-theme-500/5 blur-[120px] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
