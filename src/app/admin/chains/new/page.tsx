import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import NewChainForm from "./NewChainForm";

export default async function NewChainPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isGlobalAdmin = user?.role === "GLOBAL_ADMIN";

  let userOrgIds: string[] = [];
  if (user && !isGlobalAdmin) {
    const roles = await prisma.organizationRole.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    userOrgIds = roles.map((r: { organizationId: string }) => r.organizationId);
  }

  const organizations = await prisma.organization.findMany({
    where: isGlobalAdmin ? undefined : { id: { in: userOrgIds } },
    orderBy: { name: "asc" }
  });

  return (
    <div className="p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <Link href="/admin/chains" className="text-[--color-text-muted] hover:text-[--color-text-base] transition-colors text-sm mb-4 inline-block">
          ← Back to Prayer Chains
        </Link>
        <h1 className="text-3xl font-bold text-[--color-text-base]">Create New Prayer Chain</h1>
        <p className="text-[--color-text-muted] mt-2">Configure a new continuous prayer initiative constraint by dates to ensure continuous coverage.</p>
      </div>

      <NewChainForm organizations={organizations} />
    </div>
  );
}
