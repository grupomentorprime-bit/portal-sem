import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { SecuritySettingsClient } from "@/components/admin/SecuritySettingsClient";

export const dynamic = "force-dynamic";

export default function SecuritySettingsPage() {
  return (
    <AdminPageFrame
      title="Seguridad"
      description="Contraseña, sesiones y protección de tu cuenta"
      backHref="/admin/settings/profile"
      backLabel="Volver al perfil"
    >
      <SecuritySettingsClient />
    </AdminPageFrame>
  );
}
