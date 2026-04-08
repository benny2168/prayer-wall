"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { logActivity } from "@/lib/activity_log";
import { ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatInTimezone, sendSignupConfirmation } from "@/lib/email";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function signupForPrayerChainBlock(
  chainId: string,
  data: {
    startTime: string; // ISO string
    name: string;
    email?: string;
    phoneNumber?: string;
    wantsReminder?: boolean;
  }
) {
  if (!data.name) {
    return { error: "Name is required." };
  }

  try {
    const chain = await prisma.prayerChain.findUnique({
      where: { id: chainId },
      include: {
        organization: true,
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
        phoneNumber: data.phoneNumber ? data.phoneNumber.trim() : null,
        wantsReminder: data.wantsReminder ?? true,
        notified: false,
      },
    });

    const session = await getServerSession(authOptions);
    await logActivity({
      type: ActivityType.CHAIN_SIGNUP,
      message: `User ${signup.name} (${signup.email || 'anonymous'}) signed up for ${chain.title}`,
      userId: session?.user?.id,
      organizationId: chain.organizationId
    });

    // Send confirmation email if they provided one
    if (signup.email) {
      const dateStr = formatInTimezone(new Date(data.startTime), chain.organization.timezone);
      await sendSignupConfirmation(signup.email, signup.name, chain.title, dateStr);
    }

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

export async function cancelPrayerChainSignup(signupId: string) {
  try {
    const deleted = await prisma.prayerChainSignup.delete({
      where: { id: signupId },
      include: { prayerChain: true }
    });

    const session = await getServerSession(authOptions);
    await logActivity({
      type: ActivityType.CHAIN_CANCEL,
      message: `Intercessor ${deleted.name} dropped commitment for ${deleted.prayerChain.title}`,
      userId: session?.user?.id,
      organizationId: deleted.prayerChain.organizationId
    });

    revalidatePath("/[org-slug]/chain", "page");
    return { success: true };
  } catch (error) {
    console.error("Error canceling signup:", error);
    return { error: "Failed to cancel your commitment. Please contact an administrator." };
  }
}
