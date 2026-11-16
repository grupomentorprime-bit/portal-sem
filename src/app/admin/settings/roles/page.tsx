import { RolesPermissionsClient } from "@/components/admin/permissions/RolesPermissionsClient";
import { requirePageAnyPermission } from "@/lib/admin/require-page-permission";

export const dynamic = "force-dynamic";

export default async function RolesPermissionsPage() {
  await requirePageAnyPermission(["identity.roles.manage"], {
    nextPath: "/admin/settings/roles",
  });

  return <RolesPermissionsClient />;
}
