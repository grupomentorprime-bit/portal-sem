import { ChannelsSettingsClient } from "@/components/admin/ChannelsSettingsClient";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import {
  GROWTH_CHANNELS_PAGE_DESCRIPTION,
  GROWTH_CHANNELS_PAGE_TITLE,
} from "@/lib/growth/labels";
import { requirePageAnyPermission } from "@/lib/admin/require-page-permission";

export const dynamic = "force-dynamic";

export default async function ChannelsSettingsPage() {
  await requirePageAnyPermission(["settings.integrations"], {
    nextPath: "/admin/settings/channels",
  });

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
