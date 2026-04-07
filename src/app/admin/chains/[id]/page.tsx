import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import EditChainForm from "./EditChainForm";
import SignupManager from "./SignupManager";

export default async function ChainDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const { id } = await params;

  if (!user) redirect("/login");

  const chain = await prisma.prayerChain.findUnique({
    where: { id },
    include: {
      organization: true,
      signups: {
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!chain) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Prayer Chain not found.</h1>
        <Link href="/admin/chains" className="text-theme-400 hover:underline">
          &larr; Back to Chains
        </Link>
      </div>
    );
  }

  const isGlobalAdmin = user.role === "GLOBAL_ADMIN";
  
  if (!isGlobalAdmin) {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: chain.organizationId,
        },
      },
    });

    if (!role) {
      redirect("/admin/chains");
    }
  }

  // Generate all time slots based on chain parameters
  const generateTimeSlots = () => {
    const slots = [];
    
    // DB returns UTC midnight for the strictly entered YYYY-MM-DD string.
    // We must extract those exact parts and construct a Local midnight date to avoid timezone shifts.
    const startLocal = new Date(chain.start_time.getUTCFullYear(), chain.start_time.getUTCMonth(), chain.start_time.getUTCDate());
    const endLocal = new Date(chain.end_time.getUTCFullYear(), chain.end_time.getUTCMonth(), chain.end_time.getUTCDate(), 23, 59, 59);
    
    let currentStart = new Date(startLocal);
    const end = new Date(endLocal);
    
    // Parse daily start/end limits (HH:mm)
    const [dailyStartH, dailyStartM] = chain.daily_start.split(':').map(Number);
    const [dailyEndH, dailyEndM] = chain.daily_end.split(':').map(Number);
    
    // Safety check - prevent infinite loop if dates are backwards
    if (currentStart >= end) return [];
    
    // Safety limit to prevent memory exhaustion (max 10,000 slots = ~1 year of 1hr slots)
    let loopCount = 0;
    const maxLoops = 10000;

    while (currentStart < end && loopCount < maxLoops) {
      loopCount++;
      const currentH = currentStart.getHours();
      const currentM = currentStart.getMinutes();
      const timeInMinutes = currentH * 60 + currentM;
      const dailyStartMinutes = dailyStartH * 60 + dailyStartM;
      let dailyEndMinutes = dailyEndH * 60 + dailyEndM;

      // Handle overnight shifts (e.g. 22:00 to 06:00)
      if (dailyEndMinutes <= dailyStartMinutes) {
        // If we are before the end time of the overnight shift, we are in the active window
        if (timeInMinutes < dailyEndMinutes) {
          slots.push(new Date(currentStart));
        } 
        // If we are after the start time of the overnight shift, we are in the active window
        else if (timeInMinutes >= dailyStartMinutes) {
          slots.push(new Date(currentStart));
        }
      } else {
        // Standard same-day window
        if (timeInMinutes >= dailyStartMinutes && timeInMinutes < dailyEndMinutes) {
          slots.push(new Date(currentStart));
        }
      }

      currentStart = new Date(currentStart.getTime() + chain.block_duration_mins * 60000);
    }
    return slots;
  };

  const allSlots = generateTimeSlots();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin/chains" className="text-sm font-medium text-[--color-text-muted] hover:text-[--color-text-base] mb-2 inline-flex items-center transition-colors">
            <span className="mr-1">&larr;</span> Back to Chains
          </Link>
          <h1 className="text-3xl font-bold text-[--color-text-base] mt-1 flex items-center gap-3">
            {chain.title}
            <span className={`text-xs px-2 py-0.5 rounded-md border ${chain.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-[--color-text-muted] border-slate-500/30'}`}>
              {chain.isActive ? "Active" : "Inactive"}
            </span>
          </h1>
          <p className="text-[--color-text-muted] font-medium mt-1">
            in {chain.organization.name}
          </p>
        </div>
        <a 
          href={`/${chain.organization.slug}/chain`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-secondary !py-2 !px-4 self-start md:self-auto text-sm"
        >
          View Public Page ↗
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 border border-[--color-border-base] rounded-xl bg-[--color-bg-panel]/50 p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6 text-[--color-text-base]">Chain Settings</h2>
          <EditChainForm chain={chain} />
        </div>

        <div className="lg:col-span-2 border border-[--color-border-base] rounded-xl bg-[--color-bg-panel]/50 p-0 overflow-hidden">
          <div className="p-6 border-b border-[--color-border-base]">
            <h2 className="text-xl font-semibold text-[--color-text-base]">Signups Manager</h2>
            <p className="text-sm text-[--color-text-muted] mt-1">
              View and manually adjust signups for every time block.
            </p>
          </div>
          
          <SignupManager 
            chainId={chain.id}
            allSlots={allSlots}
            existingSignups={chain.signups}
            maxPeoplePerBlock={chain.max_people_per_block}
          />
        </div>
      </div>
    </div>
  );
}
