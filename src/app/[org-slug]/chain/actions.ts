"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function signupForPrayerChainBlock(
  chainId: string,
  data: {
    startTime: string; // ISO string
    name: string;
    email?: string;
  }
) {
  if (!data.name) {
    return { error: "Name is required." };
  }

  try {
    const chain = await prisma.prayerChain.findUnique({
      where: { id: chainId },
      include: {
        _count: {
          select: {
            signups: {
              where: { startTime: new Date(data.startTime) },
            },
          },
        },
      },
    });

    if (!chain) return { error: "Prayer Chain not found." };

    if (chain._count.signups >= chain.max_people_per_block) {
      return { error: "This time slot is already full. Please select another." };
    }

    const signup = await prisma.prayerChainSignup.create({
      data: {
        prayerChainId: chainId,
        startTime: new Date(data.startTime),
        name: data.name,
        email: data.email ? data.email.trim() : null,
        notified: false,
      },
    });

    revalidatePath("/[org-slug]/chain", "page");
    return { success: true, signup };
  } catch (error: any) {
    console.error("Error signing up for block:", error);
    if (error?.code === "P2002") {
      return { error: "You have already signed up for this specific time block." };
    }
    return { error: "Failed to sign up. Please try again." };
  }
}
