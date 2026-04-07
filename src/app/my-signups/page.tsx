import MemberActivityView from "@/components/MemberActivityView";

export default function MySignupsPage() {
  return (
    <main className="min-h-screen bg-[--color-bg-base] relative p-4 sm:p-12 overflow-x-hidden flex items-start justify-center">
      <div className="fixed inset-0 bg-gradient-to-br from-theme-500/5 via-theme-500/10 to-[--color-bg-base] pointer-events-none" />
      <MemberActivityView />
    </main>
  );
}

