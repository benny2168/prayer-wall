import { prisma } from "@/lib/prisma";
import EmailClient from "./EmailClient";
import { getSiteTheme } from "@/lib/email";

export default async function AdminEmailsPage() {
  const [audits, templates, upcomingReminders, siteTheme, testChain] = await Promise.all([
    prisma.emailAudit.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.emailTemplate.findMany(),
    prisma.prayerChainSignup.findMany({
      where: {
        wantsReminder: true,
        startTime: { gt: new Date() }
      },
      include: {
        prayerChain: { include: { organization: true } }
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    }),
    getSiteTheme(),
    prisma.prayerChain.findFirst({
      include: { organization: true }
    })
  ]);

  return (
    <EmailClient 
      audits={audits} 
      templates={templates} 
      upcomingReminders={upcomingReminders}
      siteTheme={siteTheme}
      orgName={testChain?.organization.name || "Main Church"}
      testChainTitle={testChain?.title || "24/7 Prayer Watch"}
    />
  );
}
