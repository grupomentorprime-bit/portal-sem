import { AutomatizacionEditorClient } from "@/components/admin/growth/AutomatizacionEditorClient";
import { EmptyState } from "@/components/admin/kit";
import { AdminModulePage } from "@/components/admin/kit/layout/AdminModulePage";
import { Button } from "@/components/ui/button";
import { can } from "@/core/identity/policies/engine";
import { getAutomationHistoryView } from "@/lib/growth/automations-history";
import { AUTOMATION_PAGE_TITLE } from "@/lib/growth/automations-labels";
import { getAutomationDetailView } from "@/lib/growth/automations-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { CircleOff } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAutomatizacionDetailPage({
  params,
}: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  const { id } = await params;
  if (!session || !tenantId || !session.membership) {
    redirect(
      `/admin/login?next=/admin/automatizaciones/${encodeURIComponent(id)}`
    );
  }

  const { resolvePermissionsForMembership } = await import(
    "@/lib/identity/permission-resolver"
  );
  const { readPlatformRoles } = await import(
    "@/core/identity/platform/capability"
  );
  const permissions = await resolvePermissionsForMembership(
    tenantId,
    session.membership
  );
  const authCtx = {
    user: session.user,
    session: session.session,
    membership: session.membership,
    permissions,
    tenantId,
    platformRoles: readPlatformRoles(session.user),
    compatMode: false,
  };

  if (!can(authCtx, "growth.automations.view")) {
    redirect("/admin");
  }

  const canManage = can(authCtx, "growth.automations.manage");
  const detail = await getAutomationDetailView(tenantId, id);

  if (!detail) {
    return (
      <AdminModulePage
        breadcrumbs={[
          { label: "Inicio", href: "/admin" },
          { label: AUTOMATION_PAGE_TITLE, href: "/admin/automatizaciones" },
          { label: "No encontrada" },
        ]}
        title="Automatización no encontrada"
      >
        <EmptyState
          title="No encontramos esta automatización"
          description="Puede haber sido eliminada o pertenecer a otro Espacio."
          icon={<CircleOff className="h-8 w-8" />}
          action={{
            label: "Volver al listado",
            href: "/admin/automatizaciones",
          }}
        />
        <div className="mt-4">
          <Button href="/admin/automatizaciones" variant="outline" size="sm">
            Volver
          </Button>
        </div>
      </AdminModulePage>
    );
  }

  const readOnlyPublished =
    detail.automation.draftVersion == null &&
    detail.automation.publishedVersion != null;

  const history =
    detail.automation.status === "active"
      ? await getAutomationHistoryView(tenantId, id)
      : null;

  return (
    <AutomatizacionEditorClient
      mode="edit"
      canManage={canManage}
      automation={detail.automation}
      initialSteps={detail.steps}
      readOnlyPublished={readOnlyPublished}
      historyRuns={history?.ok ? history.runs : []}
    />
  );
}
