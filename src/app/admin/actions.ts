"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity_log";
import { ActivityType } from "@prisma/client";

interface AuthUser {
  id: string;
  role: string;
}

/**
 * Resilient helper to handle file uploads in Docker/Synology environments
 */
async function saveUploadedFile(file: File, type: 'logo' | 'banner' | 'chain', identifier: string = ""): Promise<{ url: string; error?: string }> {
  if (!file || file.size === 0) return { url: "", error: "No file provided" };
  
  try {
    const fs = require('fs/promises');
    const path = require('path');
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Map internal types to organized folder names
    const folderName = {
      'logo': 'logos',
      'banner': 'banners',
      'chain': 'chains'
    }[type];

    const fileName = `${identifier || type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'data', 'uploads', folderName);
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists with recursive mkdir
    await fs.mkdir(uploadDir, { recursive: true });
    
    console.log(`[UploadHelper] Writing ${type} to organized path: ${filePath}`);
    await fs.writeFile(filePath, buffer);
    
    return { url: `/api/uploads/${folderName}/${fileName}` };
  } catch (e: any) {
    console.error(`[UploadHelper] CRITICAL FAILURE for ${type}:`, e);
    return { url: "", error: e.message || "FileSystem Error" };
  }
}

export async function createOrganization(formData: FormData) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (user?.role !== "GLOBAL_ADMIN") {
    return { error: "Unauthorized. Only Global Admins can create organizations." };
  }

  const name = formData.get("name") as string;
  const timezone = formData.get("timezone") as string || "UTC";

  if (!name) return { error: "Name is required" };

  let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!baseSlug) baseSlug = "org";

  try {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existing = await prisma.organization.findUnique({ where: { slug } });
      if (!existing) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const org = await prisma.organization.create({
      data: { name, slug, timezone },
    });

    await logActivity({
      type: ActivityType.ORG_CREATED,
      message: `Created organization: ${name}`,
      userId: user.id
    });

    revalidatePath("/admin/organizations");
    return { success: true };
  } catch (e) {
    return { error: "Failed to create organization." };
  }
}

export async function archivePrayer(prayerId: string, archive: boolean) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const prayer = await prisma.prayer.findUnique({
      where: { id: prayerId },
      select: { organizationId: true },
    });

    if (!prayer) return { error: "Prayer not found." };

    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: prayer.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.prayer.update({
      where: { id: prayerId },
      data: { isArchived: archive },
    });
    revalidatePath("/admin/prayers");
    return { success: true };
  } catch (e) {
    return { error: "Failed to update prayer." };
  }
}

export async function deletePrayer(prayerId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const prayer = await prisma.prayer.findUnique({
      where: { id: prayerId },
      select: { organizationId: true },
    });

    if (!prayer) return { error: "Prayer not found." };

    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: prayer.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.prayer.delete({ where: { id: prayerId } });
    revalidatePath("/admin/prayers");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete prayer." };
  }
}

export async function createPrayerChain(formData: FormData) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  const orgId = formData.get("orgId") as string;

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const daily_start = formData.get("daily_start") as string;
  const daily_end = formData.get("daily_end") as string;
  const block_duration_mins = parseInt(formData.get("block_duration_mins") as string);
  const max_people_per_block = parseInt(formData.get("max_people_per_block") as string);
  const isPublic = formData.get("isPublic") === "on";
  const isActive = formData.get("isActive") === "on";
  
  const thumbnailFile = formData.get("thumbnail") as File | null;
  let thumbnailUrl = null;

  if (thumbnailFile && thumbnailFile.size > 0) {
    const upload = await saveUploadedFile(thumbnailFile, 'chain');
    if (upload.error) return { error: `Thumbnail upload failed: ${upload.error}` };
    thumbnailUrl = upload.url;
  }

  try {
    const chain = await prisma.prayerChain.create({
      data: {
        title,
        description,
        thumbnailUrl,
        organizationId: orgId,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        daily_start,
        daily_end,
        block_duration_mins,
        max_people_per_block,
        isPublic,
        isActive,
      },
      include: { organization: true }
    });

    await logActivity({
      type: ActivityType.CHAIN_CREATED,
      message: `Created prayer chain: ${title}`,
      userId: user.id,
      organizationId: orgId
    });

    revalidatePath("/admin/chains");
  } catch (e) {
    console.error(e);
    return { error: "Failed to create prayer chain." };
  }
  
  redirect("/admin/chains");
}

export async function updatePrayerChain(chainId: string, dataOrFormData: any) {
  // Convert FormData to plain object if needed
  const isFormData = dataOrFormData instanceof FormData;
  const data = isFormData ? Object.fromEntries((dataOrFormData as FormData).entries()) : dataOrFormData;

  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  const chain = await prisma.prayerChain.findUnique({
    where: { id: chainId },
    select: { organizationId: true },
  });

  if (!chain) return { error: "Chain not found." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: chain.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    let thumbnailUrl: string | undefined = undefined;
    
    // Check if we have a file in the data
    const thumbnail = isFormData ? (dataOrFormData as FormData).get("thumbnail") : data.thumbnail;
    
    if (thumbnail && typeof thumbnail === 'object' && 'size' in (thumbnail as any) && (thumbnail as any).size > 0) {
      const upload = await saveUploadedFile(thumbnail as File, 'chain');
      if (upload.error) return { error: `Update failed: ${upload.error}` };
      thumbnailUrl = upload.url;
    }

    console.log(`[DEBUG] Updating Chain ${chainId}`, {
      title: data.title,
      hasThumbnail: !!thumbnailUrl,
      isActive: data.isActive
    });

    await prisma.prayerChain.update({
      where: { id: chainId },
      data: {
        title: data.title,
        description: data.description,
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        start_time: new Date(data.start_time),
        end_time: new Date(data.end_time),
        daily_start: data.daily_start,
        daily_end: data.daily_end,
        block_duration_mins: parseInt(data.block_duration_mins),
        max_people_per_block: parseInt(data.max_people_per_block),
        isPublic: data.isPublic === "on" || data.isPublic === true,
        isActive: data.isActive === "on" || data.isActive === true,
      },
    });
    revalidatePath("/admin/chains");
    revalidatePath(`/admin/chains/${chainId}`);
    return { success: true };
  } catch (e: any) {
    console.error("[CRITICAL] updatePrayerChain Error:", e);
    return { error: `Update failed: ${e.message || "Unknown error"}` };
  }
}

export async function addPrayerChainSignup(chainId: string, startTime: Date, name: string, email?: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  const chain = await prisma.prayerChain.findUnique({
    where: { id: chainId },
    select: { organizationId: true, max_people_per_block: true },
  });

  if (!chain) return { error: "Chain not found." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: chain.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    const existingCount = await prisma.prayerChainSignup.count({
      where: { prayerChainId: chainId, startTime },
    });

    if (existingCount >= chain.max_people_per_block) {
      return { error: "This time block is already full." };
    }

    await prisma.prayerChainSignup.create({
      data: {
        prayerChainId: chainId,
        startTime,
        name,
        email: email ? email.trim() : null,
      },
    });
    
    revalidatePath(`/admin/chains/${chainId}`);
    return { success: true };
  } catch (e) {
    // Check for unique constraint violation (same email for same block)
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
      return { error: "User is already signed up for this block." };
    }
    console.error("addPrayerChainSignup Error:", e);
    return { error: "Failed to add signup." };
  }
}

export async function removePrayerChainSignup(signupId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  const signup = await prisma.prayerChainSignup.findUnique({
    where: { id: signupId },
    include: { prayerChain: { select: { organizationId: true } } },
  });

  if (!signup) return { error: "Signup not found." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: signup.prayerChain.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.prayerChainSignup.delete({ where: { id: signupId } });
    revalidatePath(`/admin/chains/${signup.prayerChainId}`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to remove signup." };
  }
}

export async function updatePrayerChainSignup(signupId: string, name: string, email?: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (!name || name.trim() === "") return { error: "Name is required." };

  const signup = await prisma.prayerChainSignup.findUnique({
    where: { id: signupId },
    include: { prayerChain: { select: { organizationId: true } } },
  });

  if (!signup) return { error: "Signup not found." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: signup.prayerChain.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.prayerChainSignup.update({
      where: { id: signupId },
      data: {
        name,
        email: email ? email.trim() : null,
      },
    });
    
    revalidatePath(`/admin/chains/${signup.prayerChainId}`);
    return { success: true };
  } catch (e) {
    console.error("updatePrayerChainSignup Error:", e);
    return { error: "Failed to update signup." };
  }
}

export async function deleteOrganization(orgId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.organization.delete({ where: { id: orgId } });
    revalidatePath("/admin/organizations");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete organization." };
  }
}

export async function deletePrayerChain(chainId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const chain = await prisma.prayerChain.findUnique({
      where: { id: chainId },
      select: { organizationId: true },
    });

    if (!chain) return { error: "Chain not found." };

    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: chain.organizationId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.prayerChain.delete({ where: { id: chainId } });
    revalidatePath("/admin/chains");
    return { success: true };
  } catch (e) {
    return { error: "Failed to delete prayer chain." };
  }
}

export async function clearPrayerChainThumbnail(chainId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  try {
    await prisma.prayerChain.update({
      where: { id: chainId },
      data: { thumbnailUrl: null },
    });
    revalidatePath(`/admin/chains/${chainId}`);
    return { success: true };
  } catch (e: any) {
    console.error("clearPrayerChainThumbnail Error:", e);
    return { error: `Failed to clear thumbnail: ${e.message}` };
  }
}

export async function updateSiteLogo(formData: FormData, mode: 'light' | 'dark') {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (user?.role !== "GLOBAL_ADMIN") {
    return { error: "Unauthorized. Only global admins can set the site logo." };
  }

  try {
    const file = formData.get("logo") as File;
    const upload = await saveUploadedFile(file, 'logo', `site-${mode}`);
    if (upload.error) return { error: upload.error };
    
    const logoUrl = upload.url;

    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: mode === 'light' ? { lightLogoUrl: logoUrl } : { darkLogoUrl: logoUrl },
      create: { 
        id: "default", 
        ...(mode === 'light' ? { lightLogoUrl: logoUrl } : { darkLogoUrl: logoUrl })
      },
    });

    revalidatePath("/", "layout"); // Revalidate entire app layout
    return { success: true };
  } catch (e: any) {
    console.error("[LogoUpload] CRITICAL ERROR:", e);
    return { error: `Upload failed: ${e.message || "Unknown file system error"}` };
  }
}

export async function clearSiteLogoMode(mode: 'light' | 'dark') {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (user?.role !== "GLOBAL_ADMIN") {
    return { error: "Unauthorized." };
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: mode === 'light' ? { lightLogoUrl: null } : { darkLogoUrl: null },
      create: { id: "default" },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { error: "Failed to clear logo." };
  }
}

export async function updateOrganizationBanner(orgId: string, formData: FormData) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    const file = formData.get("banner") as File;
    const upload = await saveUploadedFile(file, 'banner', `org-${orgId}`);
    if (upload.error) return { error: upload.error };
    
    const bannerUrl = upload.url;

    await prisma.organization.update({
      where: { id: orgId },
      data: { bannerUrl },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/[org-slug]", "page");
    return { success: true };
  } catch (e: any) {
    console.error("updateOrganizationBanner Error:", e);
    return { error: `Failed to update banner: ${e.message}` };
  }
}

export async function clearOrganizationBanner(orgId: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { bannerUrl: null },
    });
    revalidatePath("/admin/organizations");
    revalidatePath("/[org-slug]", "page");
    return { success: true };
  } catch (e) {
    return { error: "Failed to clear banner." };
  }
}

export async function updateOrganizationTimezone(orgId: string, timezone: string) {
  const session = await getServerSession(authOptions) as Session & { user?: AuthUser };
  const user = session?.user;

  if (!user) return { error: "Unauthorized." };

  if (user.role !== "GLOBAL_ADMIN") {
    const role = await prisma.organizationRole.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (!role) {
      return { error: "Unauthorized. You are not an admin of this organization." };
    }
  }

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { timezone },
    });

    revalidatePath("/admin/organizations");
    return { success: true };
  } catch (e: any) {
    console.error("updateOrganizationTimezone Error:", e);
    return { error: `Failed to update timezone: ${e.message}` };
  }
}

