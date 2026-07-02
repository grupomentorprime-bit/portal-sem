import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { UsuariosCmsClient } from "@/components/admin/UsuariosCmsClient";

export const dynamic = "force-dynamic";

export default function UsuariosCmsPage() {
  return (
    <AdminPageFrame
      title="Usuarios CMS"
      description="Administradores, editores y colaboradores con acceso al panel"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <UsuariosCmsClient />
    </AdminPageFrame>
  );
}
