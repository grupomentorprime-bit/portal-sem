import { AutomatizacionEditorClient } from "@/components/admin/growth/AutomatizacionEditorClient";
import { can } from "@/core/identity/policies/engine";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAutomatizacionNuevaPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/automatizaciones/nueva");
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

  if (!can(authCtx, "growth.automations.view")) {
    redirect("/admin");
  }

  const canManage = can(authCtx, "growth.automations.manage");
  if (!canManage) {
    redirect("/admin/automatizaciones");
  }

  return <AutomatizacionEditorClient mode="create" canManage />;
}
