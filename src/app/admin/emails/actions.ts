"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateEmailTemplate(type: string, subject: string, content: string) {
  await prisma.emailTemplate.upsert({
    where: { type },
    update: { subject, content },
    create: { type, subject, content },
  });
  revalidatePath("/admin/emails");
}

export async function clearEmailAudits() {
  await prisma.emailAudit.deleteMany();
  revalidatePath("/admin/emails");
}
