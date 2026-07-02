import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
} from "@/components/admin/AdminModuleCenter";
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
          description="Publicaciones, invitaciones y cambios importantes aparecerán aquí en la siguiente fase."
        />
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="font-medium text-foreground">Próximamente</p>
          <p className="mt-2 text-sm text-muted">
            Estamos preparando alertas en tiempo real para el equipo del seminario.
          </p>
        </div>
      </AdminModuleCenter>
    </AdminPageFrame>
  );
}
