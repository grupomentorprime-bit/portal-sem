import { FormsCenterClient } from "@/components/admin/forms/FormsCenterClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { listExperienceForms } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

export default async function ConvocatoriasConfigPage() {
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

  return (
    <FormsCenterClient
      initialForms={forms}
      tenantId={tenantId}
      scope="convocatorias"
    />
  );
}
