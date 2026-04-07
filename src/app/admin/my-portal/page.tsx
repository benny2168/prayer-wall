import MemberActivityView from "@/components/MemberActivityView";

export default function AdminPortalPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">My Intercessions</h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">Manage your personal intercession requests and your active prayer chain commitments.</p>
      </div>
      
      <MemberActivityView isAdminView={true} />
    </div>
  );
}
