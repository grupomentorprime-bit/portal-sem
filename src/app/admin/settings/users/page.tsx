import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UsuariosCmsClient } from "@/components/admin/UsuariosCmsClient";

export const dynamic = "force-dynamic";

export default function UsuariosCmsPage() {
  return (
    <AdminPageFrame
      title="Usuarios CMS"
      description="Equipo, invitaciones y actividad de accesos al panel."
      actions={<></>}
    >
      <UsuariosCmsClient />
    </AdminPageFrame>
  );
}
