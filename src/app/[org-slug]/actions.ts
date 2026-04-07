"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPrayedForNotification } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function submitPrayer(
  orgId: string,
  data: {
    text: string;
    name?: string;
    email?: string;
    notify_if_prayed?: boolean;
    isPublic?: boolean;
    isAnonymous?: boolean;
  }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  
  if (!data.text || data.text.trim() === "") {
    return { error: "Prayer text is required." };
  }

  // Determine final name and email
  const finalName = data.isAnonymous ? null : (user?.name || data.name || null);
  const finalEmail = user?.email || data.email || null;

  try {
    const prayer = await prisma.prayer.create({
      data: {
        text: data.text,
        name: finalName,
        email: finalEmail,
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
    const session = await getServerSession(authOptions);
    
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch {
      // fallback if not async
      cookieStore = (cookies as any)();
    }
    
    let visitorId = cookieStore.get("prayer_visitor_id")?.value;
    
    if (!visitorId) {
      visitorId = randomUUID();
      try {
         cookieStore.set("prayer_visitor_id", visitorId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true });
      } catch(e) {
         console.error("Could not set visitor cookie", e)
      }
    }

    const intercessorId = session?.user?.email || visitorId;
    const prayedByName = session?.user?.name || "A member of the community";

    const prayer = await prisma.prayer.findUnique({ where: { id: prayerId } });
    if (!prayer) return { error: "Prayer not found." };

    if (prayer.intercessorIds && prayer.intercessorIds.includes(intercessorId)) {
      // Already prayed, silent success
      return { success: true, count: prayer.prayer_count };
    }

    const updatedPrayer = await prisma.prayer.update({
      where: { id: prayerId },
      data: {
        prayer_count: { increment: 1 },
        intercessorIds: { push: intercessorId }
      }
    });

    if (updatedPrayer.notify_if_prayed && updatedPrayer.email) {
      await sendPrayedForNotification(updatedPrayer.email, updatedPrayer.text, prayedByName);
    }

    revalidatePath(`/[org-slug]`, "page");
    return { success: true, count: updatedPrayer.prayer_count };
  } catch (error) {
    console.error("Error marking prayed for:", error);
    return { error: "Failed to process request." };
  }
}
