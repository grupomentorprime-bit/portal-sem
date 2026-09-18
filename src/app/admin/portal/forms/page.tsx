import { FormsCenterClient } from "@/components/admin/forms/FormsCenterClient";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { listExperienceForms } from "@/lib/experience/forms/repository";

export const dynamic = "force-dynamic";

export default async function AdminFormsCenterPage() {
  const config = await getOperationalSiteConfig();
  const tenantId = config?.institution.tenant?.trim() ?? "";
  if (!tenantId) {
    return <p className="p-6 text-sm text-muted">Portal no configurado.</p>;
  }

  const forms = await listExperienceForms(tenantId);

  return <FormsCenterClient initialForms={forms} tenantId={tenantId} />;
}
