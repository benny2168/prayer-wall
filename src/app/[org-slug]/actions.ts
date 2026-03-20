"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPrayedForNotification } from "@/lib/email";

export async function submitPrayer(
  orgId: string,
  data: {
    text: string;
    name?: string;
    email?: string;
    notify_if_prayed?: boolean;
    isPublic?: boolean;
  }
) {
  if (!data.text || data.text.trim() === "") {
    return { error: "Prayer text is required." };
  }

  try {
    const prayer = await prisma.prayer.create({
      data: {
        text: data.text,
        name: data.name || null,
        email: data.email || null,
        notify_if_prayed: data.notify_if_prayed || false,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        organizationId: orgId,
      },
    });

    revalidatePath(`/[org-slug]`, "page");
    return { success: true, prayer };
  } catch (error) {
    console.error("Error submitting prayer:", error);
    return { error: "Failed to submit prayer. Please try again." };
  }
}

export async function markPrayedFor(prayerId: string) {
  try {
    const prayer = await prisma.prayer.findUnique({ where: { id: prayerId } });
    if (!prayer) return { error: "Prayer not found." };

    if (prayer.notify_if_prayed && prayer.email) {
      await sendPrayedForNotification(prayer.email, prayer.text);
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking prayed for:", error);
    return { error: "Failed to process request." };
  }
}
