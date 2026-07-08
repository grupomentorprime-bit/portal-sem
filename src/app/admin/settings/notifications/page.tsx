import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
} from "@/components/admin/AdminModuleCenter";
import { NotificationsClient } from "@/components/admin/notifications/NotificationsClient";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotificationsSettingsPage() {
  return (
    <AdminPageFrame
      title="Notificaciones"
      description="Alertas del CMS y avisos institucionales"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <AdminModuleCenter>
        <AdminModuleHero {...ADMIN_PANEL_META.notifications} />
        <AdminModuleSectionHeader
          icon={Bell}
          title="Centro de notificaciones"
          description="Avisos de informes validados, asignaciones de seguimiento y gestiones del equipo."
        />
        <NotificationsClient />
      </AdminModuleCenter>
    </AdminPageFrame>
  );
}
