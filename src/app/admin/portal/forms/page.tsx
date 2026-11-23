import { FormsCenterClient } from "@/components/admin/forms/FormsCenterClient";
import { getSessionActiveTenantId, isAuthContext, requirePermission } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { listExperienceForms } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

export default async function AdminFormsCenterPage() {
  const auth = await requirePermission("experience.forms.read");
  if (!isAuthContext(auth)) {
    return <p className="p-6 text-sm text-muted">No autorizado.</p>;
  }

  // SSOT admin: Espacio activo de sesión (como Menús / layout). No Host público.
  const [sessionTenantId, config] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
  ]);
  const tenantId =
    sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const forms = await listExperienceForms(tenantId);

  return <FormsCenterClient initialForms={forms} tenantId={tenantId} />;
}
