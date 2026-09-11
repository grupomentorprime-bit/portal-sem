import { redirect } from "next/navigation";
import { ChannelsSettingsClient } from "@/components/admin/ChannelsSettingsClient";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { can } from "@/core/identity/policies/engine";
import {
  GROWTH_CHANNELS_PAGE_DESCRIPTION,
  GROWTH_CHANNELS_PAGE_TITLE,
} from "@/lib/growth/labels";
import { loadSessionContext } from "@/lib/identity/sessions";

export const dynamic = "force-dynamic";

export default async function ChannelsSettingsPage() {
  const session = await loadSessionContext();
  const tenantId = session?.session.tenantId?.trim();
  if (!session || !tenantId || !session.membership) {
    redirect("/admin/login?next=/admin/settings/channels");
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

  if (!can(authCtx, "settings.integrations")) {
    redirect("/admin");
  }

  return (
    <AdminPageFrame
      title={GROWTH_CHANNELS_PAGE_TITLE}
      description={GROWTH_CHANNELS_PAGE_DESCRIPTION}
      actions={<></>}
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Ajustes" },
        { label: GROWTH_CHANNELS_PAGE_TITLE },
      ]}
    >
      <ChannelsSettingsClient />
    </AdminPageFrame>
  );
}
