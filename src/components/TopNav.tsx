import Link from "next/link";

/**
 * Shows "Manage My Prayers" in top-right corner on the home page.
 */
export default function TopNav() {
  return (
    <div className="absolute top-8 right-4 sm:right-6 z-20">
      <Link
        href="/my-signups"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-theme-500/50 text-theme-500 hover:bg-theme-500/10 dark:bg-theme-500 dark:text-white dark:border-theme-500 dark:hover:bg-theme-600 transition-all font-semibold text-xs sm:text-sm shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Manage My Prayers
      </Link>
    </div>
  );
}
