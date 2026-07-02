import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { executeContentQuery } from "@/lib/content/query";
import { getSiteConfigUncached } from "@/lib/cms/config";
import { listInvitationsByTenant } from "@/lib/identity/invitations";
import { listAuditByTenant } from "@/lib/identity/audit";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const config = await getSiteConfigUncached();
  const tenant = config?.institution.tenant ?? "default";

  let newsCount = 0;
  let programsCount = 0;
  let invitationsPending = 0;
  let recentAuditCount = 0;

  try {
    const [news, programs] = await Promise.all([
      executeContentQuery(
        { tenant, collection: "content_news", pagination: { page: 1, limit: 1 } },
        { includeDraft: true, mapItems: false, skipCache: true }
      ),
      executeContentQuery(
        { tenant, collection: "academy_programs", pagination: { page: 1, limit: 1 } },
        { includeDraft: true, mapItems: false, skipCache: true }
      ),
    ]);
    newsCount = news.total;
    programsCount = programs.total;
  } catch {
    /* métricas opcionales */
  }

  try {
    const invitations = await listInvitationsByTenant(tenant);
    invitationsPending = invitations.length;
    const audit = await listAuditByTenant(tenant, 20);
    recentAuditCount = audit.length;
  } catch {
    /* identity opcional */
  }

  return (
    <AdminPageFrame
      title="Centro de administración"
      description="Panel institucional del Seminario Eclesiástico Mayor"
      breadcrumbs={[{ label: "Inicio" }]}
      backHref="/"
      backLabel="Ver portal público"
    >
      <AdminDashboardClient
        portalStatus={config?.institution.status ?? "active"}
        institutionName={config?.institution.name ?? "SEM"}
        newsCount={newsCount}
        programsCount={programsCount}
        invitationsPending={invitationsPending}
        recentActivityCount={recentAuditCount}
      />
    </AdminPageFrame>
  );
}
