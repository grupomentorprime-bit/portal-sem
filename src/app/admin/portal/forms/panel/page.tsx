import { FormsPanelClient } from "@/components/admin/forms/FormsPanelClient";
import { getSessionActiveTenantId } from "@/core/identity";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { countSubmissionsByForm, listExperienceForms } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

export default async function FormsPanelPage() {
  const [sessionTenantId, config] = await Promise.all([
    getSessionActiveTenantId(),
    getOperationalSiteConfig(),
  ]);
  const tenantId = sessionTenantId?.trim() || config?.institution.tenant?.trim() || "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const [forms, counts] = await Promise.all([
    listExperienceForms(tenantId),
    countSubmissionsByForm(tenantId),
  ]);

  const rows = [...forms]
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((form) => ({
      id: form._id,
      name: form.name,
      responses: counts[form._id] ?? 0,
    }));

  return <FormsPanelClient rows={rows} />;
}
