import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UsuariosCmsClient } from "@/components/admin/UsuariosCmsClient";
import { requirePageAnyPermission } from "@/lib/admin/require-page-permission";

export const dynamic = "force-dynamic";

/** Superficie canónica Equipo V1 (Identity). */
export default async function EquipoPage() {
  await requirePageAnyPermission(["settings.team"], {
    nextPath: "/admin/settings/team",
  });

  return (
    <AdminPageFrame
      title="Equipo"
      description="Las personas que trabajan contigo en este Espacio."
      actions={<></>}
    >
      <UsuariosCmsClient />
    </AdminPageFrame>
  );
}
