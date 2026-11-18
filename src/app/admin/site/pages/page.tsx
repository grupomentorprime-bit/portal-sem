import { Suspense } from "react";
import { getOperationalSiteConfig } from "@/lib/cms/config";
import { requirePageAnyPermission } from "@/lib/admin/require-page-permission";
import { SitePagesClient } from "@/components/admin/site/SitePagesClient";

export const dynamic = "force-dynamic";

export default async function SitePagesPage() {
  await requirePageAnyPermission(["cms.pages.read", "cms.pages.update", "settings.update"], {
    nextPath: "/admin/site/pages",
  });

  const config = await getOperationalSiteConfig();
  const tenantId = config?.institution.tenant?.trim() ?? "";

  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-muted">Cargando páginas…</p>}>
      <SitePagesClient tenantId={tenantId} />
    </Suspense>
  );
}
