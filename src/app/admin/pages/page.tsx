import { PageListClient } from "@/components/page-builder/PageListClient";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { getAllPagesUncached } from "@/lib/cms/pages";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const config = await getOperationalSiteConfig();
  const tenant = config?.institution.tenant?.trim() ?? "";
  const pages = tenant ? await getAllPagesUncached(tenant) : [];

  return (
    <PageListClient
      pages={pages}
      tenant={tenant || "default"}
    />
  );
}
