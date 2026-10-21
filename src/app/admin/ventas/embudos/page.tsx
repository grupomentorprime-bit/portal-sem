import { FunnelsAdminClient } from "@/components/admin/growth/FunnelsAdminClient";
import { can } from "@/core/identity/policies/engine";
import { readGrowthFunnelAdmin, readGrowthStaleAfterDays } from "@/lib/growth/funnels-admin";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminFunnelsPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/login?next=/admin/ventas/embudos");
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const { readPlatformRoles } = await import("@/core/identity/platform/capability");
  const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };
  if (!can(authCtx, "growth.funnels.manage")) {
    redirect("/admin/ventas");
  }

  const [funnels, staleAfterDays] = await Promise.all([
    readGrowthFunnelAdmin(tenantId),
    readGrowthStaleAfterDays(tenantId),
  ]);
  return <FunnelsAdminClient funnels={funnels} staleAfterDays={staleAfterDays} />;
}
