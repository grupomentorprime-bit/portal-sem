import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export const dynamic = "force-dynamic";

export default function NotificationsSettingsPage() {
  return (
    <AdminPageFrame
      title="Notificaciones"
      description="Alertas del CMS y avisos institucionales"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="font-medium text-foreground">Centro de notificaciones</p>
        <p className="mt-2 text-sm text-muted">
          Publicaciones, invitaciones y cambios importantes aparecerán aquí en la siguiente fase.
        </p>
      </div>
    </AdminPageFrame>
  );
}
