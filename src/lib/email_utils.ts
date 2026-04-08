import { prisma } from "./prisma";
export { formatInTimezone, generateThemedEmail } from "./email_templates";

export async function getEmailTheme() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  
  const siteUrl = process.env.NEXTAUTH_URL || "";
  const primaryColor = settings?.primaryColor || "#6366f1";
  
  // Use the logo if available, prefer light logo for email light mode
  let logoUrl = settings?.lightLogoUrl || settings?.darkLogoUrl;
  if (logoUrl && !logoUrl.startsWith("http")) {
    logoUrl = `${siteUrl}${logoUrl}`;
  }

  return { primaryColor, logoUrl, siteUrl };
}
