import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { formatInTimezone, sendPrayerChainReminder } from "@/lib/email";
import { logActivity } from "@/lib/activity_log";
import { ActivityType } from "@prisma/client";

export async function GET(request: Request) {
  // Simple bearer token check for security (set in .env)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    // Look for slots starting in the next 15 minutes (plus/minus 5m window for cron drift)
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000); // 10m from now
    const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);   // 20m from now

    const pendingSignups = await prisma.prayerChainSignup.findMany({
      where: {
        startTime: {
          gt: windowStart,
          lt: windowEnd,
        },
        wantsReminder: true,
        notified: false,
        email: { not: null },
      },
      include: {
        prayerChain: {
          include: {
            organization: true,
          }
        }
      }
    });

    console.log(`[Cron] Found ${pendingSignups.length} reminders to send.`);

    for (const signup of pendingSignups) {
      const timeStr = formatInTimezone(signup.startTime, signup.prayerChain.organization.timezone);

      try {
        await sendPrayerChainReminder(signup.email!, signup.name, signup.prayerChain.title, timeStr);

        await logActivity({
          type: ActivityType.EMAIL_SENT,
          message: `Reminder email sent to ${signup.email} for ${signup.prayerChain.title}`,
          organizationId: signup.prayerChain.organizationId,
        });

        // Mark as notified so we don't send twice
        await prisma.prayerChainSignup.update({
          where: { id: signup.id },
          data: { notified: true },
        });
      } catch (err) {
        console.error(`[Cron] Failed to send reminder to ${signup.email}:`, err);
      }
    }

    return NextResponse.json({ sent: pendingSignups.length });
  } catch (error) {
    console.error("[Cron] Error processing reminders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
