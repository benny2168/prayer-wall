import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembersTab from "../settings/MembersTab";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function MembersPage() {
  const session = await getServerSession(authOptions) as Session & { user?: { role: string, isLocalAdmin: boolean } };
  const isGlobalAdmin =
    session?.user?.role === "GLOBAL_ADMIN" || session?.user?.isLocalAdmin;

  if (!isGlobalAdmin) redirect("/admin");

  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, image: true, role: true,
        organizations: {
          select: {
            id: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-10 text-center lg:text-left">
        <p className="text-xs font-bold text-theme-500 tracking-widest uppercase mb-2">MTCD ADMINISTRATIVE PORTAL</p>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[--color-text-title] leading-tight">Member Management</h1>
        <p className="text-[--color-text-muted] mt-3 text-lg max-w-2xl leading-relaxed">System-wide access control and organization-level permission oversight.</p>
      </div>

      <div className="glass-panel p-8">
        <MembersTab users={users as any} organizations={organizations} />
      </div>
    </div>
  );
}
