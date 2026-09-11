import { AdmissionCmsClient } from "@/components/admin/admission/AdmissionCmsClient";
import { getAdmissionConfigUncached } from "@/lib/cms/admission-config";
import { getOperationalSiteConfig } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionPage() {
  const siteConfig = await getOperationalSiteConfig();
  const tenant = siteConfig?.institution.tenant ?? "default";
  const config = await getAdmissionConfigUncached(tenant);

  return <AdmissionCmsClient initialConfig={config} tenant={tenant} />;
}
