import { prisma } from "@/lib/prisma";
import EmailClient from "./EmailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Center | Admin",
  description: "Audit and manage system communications.",
};

export default async function EmailAdminPage() {
  const audits = await prisma.emailAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const templates = await prisma.emailTemplate.findMany();

  return <EmailClient audits={audits} templates={templates} />;
}
