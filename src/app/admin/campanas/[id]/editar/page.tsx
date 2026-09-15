import { CampanaFormClient } from "@/components/admin/growth/CampanaFormClient";
import { can } from "@/core/identity/policies/engine";
import { listAutomationViews } from "@/lib/growth/automations-read";
import { campaignsGet } from "@/lib/growth/campaigns";
import { listExperienceForms } from "@/lib/experience/forms/repository";
import { loadSessionContext } from "@/lib/identity/sessions";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCampanaEditarPage({ params }: PageProps) {
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

  if (!can(authCtx, "growth.campaigns.manage")) {
    redirect("/admin/campanas");
  }

  const { id } = await params;
  const campaign = await campaignsGet(tenantId, id);
  if (!campaign) notFound();
  if (campaign.status === "ended") {
    redirect(`/admin/campanas/${id}`);
  }

  const [forms, automations] = await Promise.all([
    listExperienceForms(tenantId),
    listAutomationViews(tenantId),
  ]);

  return (
    <CampanaFormClient
      mode="edit"
      canManage
      forms={forms
        .filter((f) => !f.archived)
        .map((f) => ({ id: f._id, name: f.name }))}
      automations={automations.map((a) => ({ id: a.id, name: a.name }))}
      initial={{
        id: campaign._id,
        name: campaign.name,
        objective: campaign.objective,
        trackingKey: campaign.trackingKey,
        sourceKind: campaign.source.kind,
        formId:
          campaign.source.kind === "form" ? campaign.source.formId : "",
        automationId: campaign.automationId ?? "",
        startAt: campaign.startAt?.slice(0, 16) ?? "",
        endAt: campaign.endAt?.slice(0, 16) ?? "",
        status: campaign.status,
        audienceFilters: campaign.audience?.filters ?? [],
      }}
    />
  );
}
