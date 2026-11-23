import { AdmissionCmsClient } from "@/components/admin/admission/AdmissionCmsClient";
import { isAuthContext, requirePermission } from "@/core/identity";
import { getAdmissionConfigUncached } from "@/lib/cms/admission-config";
import { getOperationalSiteConfig } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionPage() {
  const auth = await requirePermission("cms.pages.read");
  if (!isAuthContext(auth)) {
    return <p className="p-6 text-sm text-muted">No autorizado.</p>;
  }

  const siteConfig = await getOperationalSiteConfig();
  const tenant = siteConfig?.institution.tenant ?? "default";
  const config = await getAdmissionConfigUncached(tenant);

  return <AdmissionCmsClient initialConfig={config} tenant={tenant} />;
}
