import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { ProfileProfessionalClient } from "@/components/admin/ProfileProfessionalClient";

export const dynamic = "force-dynamic";

export default function ProfileSettingsPage() {
  return (
    <AdminPageFrame
      title="Mi perfil"
      description="Ficha profesional y preferencias personales"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <ProfileProfessionalClient />
    </AdminPageFrame>
  );
}
