import { VentasListClient } from "@/components/admin/growth/VentasListClient";
import { can } from "@/core/identity/policies/engine";
import { listGrowthVentasQueue } from "@/lib/growth/ventas-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    nextAction?: string;
  }>;
}

export default async function AdminVentasPage({ searchParams }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/ventas");
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const { readPlatformRoles } = await import(
    "@/core/identity/platform/capability"
  );
  const permissions = await resolvePermissionsForMembership(
    tenantId,
    session.membership
  );
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };
  if (
    !can(authCtx, "growth.sales.read") &&
    !can(authCtx, "growth.sales.operate")
  ) {
    redirect("/admin");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const type = params.type?.trim() ?? "";
  const nextAction = params.nextAction?.trim() ?? "";

  const items = await listGrowthVentasQueue(tenantId, {
    q: q || undefined,
    status: status || undefined,
    type: type || undefined,
    nextAction: nextAction || undefined,
  });

  return (
    <VentasListClient
      items={items}
      q={q}
      status={status}
      type={type}
      nextAction={nextAction}
    />
  );
}
