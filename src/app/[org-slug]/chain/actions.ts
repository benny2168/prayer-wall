"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import { logActivity } from "@/lib/activity_log";
import { ActivityType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEmailTheme, formatInTimezone, generateThemedEmail } from "@/lib/email_utils";

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
      const { logoUrl, primaryColor } = await getEmailTheme();
      const dateStr = formatInTimezone(new Date(data.startTime), chain.organization.timezone);

      try {
        await transporter.sendMail({
          from: `"${chain.organization.name}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: signup.email,
          subject: `Commitment Confirmed: ${chain.title}`,
          html: generateThemedEmail({
            title: "Commitment Confirmed",
            name: signup.name,
            logoUrl,
            primaryColor,
            content: `
              <p>Thank you for committing to pray for <strong>${chain.title}</strong>.</p>
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${primaryColor};">${dateStr}</p>
              </div>
              <p style="margin-bottom: 24px;">Your commitment helps ensure a continuous chain of prayer for our community.</p>
              ${signup.wantsReminder 
                ? `<div style="display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px;">
                     <span>🔔</span>
                     <span>We'll send you a reminder 15 minutes before your slot.</span>
                   </div>` 
                : ""
              }
            `,
            footerText: `This is an automated message from the ${chain.organization.name} Prayer Wall.`
          })
        });

        await logActivity({
          type: ActivityType.EMAIL_SENT,
          message: `Confirmation email sent to ${signup.email} for ${chain.title}`,
          organizationId: chain.organizationId,
        });
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
      }
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
