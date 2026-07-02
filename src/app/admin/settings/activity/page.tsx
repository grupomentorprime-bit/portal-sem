import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { ActivityClient } from "@/components/admin/ActivityClient";

export const dynamic = "force-dynamic";

export default function ActivitySettingsPage() {
  return (
    <AdminPageFrame
      title="Mi actividad"
      description="Historial de cambios y accesos en el CMS"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <ActivityClient />
    </AdminPageFrame>
  );
}
