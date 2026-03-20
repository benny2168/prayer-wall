import { prisma } from "@/lib/prisma";
import { sendPrayerChainReminder } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Check optional authorization header if you want to secure this endpoint from external triggers
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Look ahead window: typically you want a reminder e.g. 15 mins before or as defined by `notify_interval_mins`.
    // Since notifications are per-chain configurable, we check all unsent signups whose startTime is within the notification window
    // of their respective chain.

    const upcomingSignups = await prisma.prayerChainSignup.findMany({
      where: {
        notified: false,
        startTime: {
          gt: now, // still in the future
        },
      },
      include: {
        prayerChain: true,
      },
    });

    let sentCount = 0;

    for (const signup of upcomingSignups) {
      const intervalMins = signup.prayerChain.notify_interval_mins || 15;
      const targetTime = new Date(signup.startTime.getTime() - intervalMins * 60000);

      // If current time has passed the target trigger time (e.g. 15 mins before)
      if (now >= targetTime) {
        if (signup.email) {
          const timeString = new Date(signup.startTime).toLocaleString(undefined, {
            weekday: "long", hour: "numeric", minute: "2-digit"
          });
          
          await sendPrayerChainReminder(signup.email, signup.name, signup.prayerChain.title, timeString);
        }
        
        await prisma.prayerChainSignup.update({
          where: { id: signup.id },
          data: { notified: true },
        });

        sentCount++;
      }
    }

    return NextResponse.json({ success: true, processed: upcomingSignups.length, sent: sentCount });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
