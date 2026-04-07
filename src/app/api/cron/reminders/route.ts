import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getEmailTheme, formatInTimezone, generateThemedEmail } from "@/lib/email_utils";
import { logActivity } from "@/lib/activity_log";
import { ActivityType } from "@prisma/client";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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

    const { logoUrl, primaryColor } = await getEmailTheme();

    for (const signup of pendingSignups) {
      const timeStr = formatInTimezone(signup.startTime, signup.prayerChain.organization.timezone);

      try {
        await transporter.sendMail({
          from: `"${signup.prayerChain.organization.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: signup.email!,
          subject: `Reminder: Your prayer slot starts at ${timeStr}`,
          html: generateThemedEmail({
            title: "Prayer Reminder",
            name: signup.name,
            logoUrl,
            primaryColor,
            content: `
              <p>This is a reminder that your prayer slot for <strong>${signup.prayerChain.title}</strong> starts in 15 minutes.</p>
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${primaryColor};">${timeStr}</p>
              </div>
              <p>Thank you for your faithful intercession. May you be blessed as you pray!</p>
            `,
            footerText: `This is an automated reminder from the ${signup.prayerChain.organization.name} Prayer Wall.`
          })
        });

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
