import { CampanasListClient } from "@/components/admin/growth/CampanasListClient";
import { can } from "@/core/identity/policies/engine";
import {
  listCampaignViews,
  summarizeCampaignList,
} from "@/lib/growth/campaigns-read";
import { loadSessionContext } from "@/lib/identity/sessions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCampanasPage() {
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

  const canManage = can(authCtx, "growth.campaigns.manage");
  const items = await listCampaignViews(tenantId);
  const summary = summarizeCampaignList(items);

  return (
    <CampanasListClient
      items={items}
      summary={summary}
      canManage={canManage}
    />
  );
}
