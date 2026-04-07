import { prisma } from "./prisma";
import { ActivityType } from "@prisma/client";

/**
 * Log a system activity.
 * Supports both server-side actions and API-based logging.
 */
export async function logActivity({
  type,
  message,
  userId,
  organizationId
}: {
  type: ActivityType;
  message: string;
  userId?: string;
  organizationId?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        message,
        userId,
        organizationId
      }
    });
  } catch (error) {
    console.error("[Activity Logger] Failed to log activity:", error);
  }
}
