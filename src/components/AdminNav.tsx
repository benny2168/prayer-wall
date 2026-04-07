import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MobileAdminNav from "./MobileAdminNav";
import DesktopAdminNav from "./DesktopAdminNav";

export default async function AdminNav() {
  const session = await getServerSession(authOptions);
  const siteSettings = await prisma.siteSettings.findUnique({ where: { id: "default" } });

  return (
    <>
      <MobileAdminNav session={session as any} siteSettings={siteSettings} />
      <DesktopAdminNav session={session as any} siteSettings={siteSettings} />
    </>
  );
}
