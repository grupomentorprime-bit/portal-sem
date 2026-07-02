import { AdmissionCmsClient } from "@/components/admin/admission/AdmissionCmsClient";
import { getAdmissionConfigUncached, seedAdmissionConfig } from "@/lib/cms/admission-config";
import { getSiteConfigUncached } from "@/lib/cms/config";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionPage() {
  const siteConfig = await getSiteConfigUncached();
  const tenant = siteConfig?.institution.tenant ?? "default";

  await seedAdmissionConfig(tenant);
  const config = await getAdmissionConfigUncached(tenant);

  return <AdmissionCmsClient initialConfig={config} tenant={tenant} />;
}
