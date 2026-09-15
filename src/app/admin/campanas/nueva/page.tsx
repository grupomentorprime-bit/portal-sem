import { CampanaFormClient } from "@/components/admin/growth/CampanaFormClient";
import { can } from "@/core/identity/policies/engine";
import { listAutomationViews } from "@/lib/growth/automations-read";
import { listExperienceForms } from "@/lib/experience/forms/repository";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCampanasNuevaPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/campanas/nueva");
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

  if (!can(authCtx, "growth.campaigns.view")) {
    redirect("/admin");
  }

  const canManage = can(authCtx, "growth.campaigns.manage");
  if (!canManage) {
    redirect("/admin/campanas");
  }

  const [forms, automations] = await Promise.all([
    listExperienceForms(tenantId),
    listAutomationViews(tenantId),
  ]);

  return (
    <CampanaFormClient
      mode="create"
      canManage={canManage}
      forms={forms
        .filter((f) => !f.archived)
        .map((f) => ({ id: f._id, name: f.name }))}
      automations={automations.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
