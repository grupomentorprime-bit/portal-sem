import { CongressOpsPanel } from "@/components/admin/congress/CongressOpsPanel";
import { isCongressVaronesPlace } from "@/core/congress/place";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { resolvePermissionsForMembership } from "@/lib/identity/permission-resolver";
import { ensureTenantRoles } from "@/lib/identity/roles";
import { loadSessionContext } from "@/lib/identity/sessions";
import { CONGRESS_VARONES_HOME_PATH } from "@/lib/admin/nav-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CongresoVaronesOpsPage() {
  const [sessionTenantId, config, session] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
    loadSessionContext(),
  ]);
  const tenantId = sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  if (!session?.membership) {
    redirect(`/login?next=${encodeURIComponent(CONGRESS_VARONES_HOME_PATH)}`);
  }

  await ensureTenantRoles(tenantId);
  const permissions = await resolvePermissionsForMembership(tenantId, session.membership);
  const canOperateCongress = permissions.some(
    (p) => p === "congress.view" || p === "congress.operate"
  );
  if (!canOperateCongress) {
    redirect("/admin");
  }

  const unitIds =
    session.membership.unitAccess?.mode === "units"
      ? session.membership.unitAccess.unitIds
      : null;
  if (!isCongressVaronesPlace({ tenantId, unitIds })) {
    redirect("/admin");
  }

  return <CongressOpsPanel />;
}
