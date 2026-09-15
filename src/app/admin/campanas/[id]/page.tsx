import { CampanaDetailClient } from "@/components/admin/growth/CampanaDetailClient";
import { can } from "@/core/identity/policies/engine";
import { automationsGet } from "@/lib/growth/automations";
import { getCampaignDetailView } from "@/lib/growth/campaigns-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCampanaDetailPage({ params }: PageProps) {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/campanas");
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

  if (!can(authCtx, "growth.campaigns.view")) {
    redirect("/admin");
  }

  const { id } = await params;
  const detail = await getCampaignDetailView(tenantId, id);
  if (!detail) notFound();

  let automationName: string | null = null;
  if (detail.campaign.automationId) {
    const auto = await automationsGet(tenantId, detail.campaign.automationId);
    automationName = auto.ok ? auto.automation.name : null;
  }

  const canManage = can(authCtx, "growth.campaigns.manage");

  return (
    <CampanaDetailClient
      campaign={detail.campaign}
      statusLabel={detail.statusLabel}
      sourceDetail={detail.sourceDetail}
      metrics={detail.metrics}
      audienceIntro={detail.audienceIntro}
      audienceLabels={detail.audienceLabels}
      actividadHref={detail.actividadHref}
      canManage={canManage}
      automationName={automationName}
    />
  );
}
