import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UsuariosCmsClient } from "@/components/admin/UsuariosCmsClient";

export const dynamic = "force-dynamic";

/** Superficie canónica Equipo V1 (Identity). */
export default function EquipoPage() {
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
