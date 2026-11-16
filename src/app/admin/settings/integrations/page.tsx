import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { StorageIntegrationsClient } from "@/components/admin/StorageIntegrationsClient";
import { requirePageAnyPermission } from "@/lib/admin/require-page-permission";

export const dynamic = "force-dynamic";

export default async function IntegrationsSettingsPage() {
  await requirePageAnyPermission(["settings.integrations"], {
    nextPath: "/admin/settings/integrations",
  });

  return (
    <AdminPageFrame
      title="Integraciones"
      description="Almacenamiento en la nube y conexiones de plataforma"
      backHref="/admin/settings/users"
      backLabel="Volver a administración"
      breadcrumbs={[
        { label: "Inicio", href: "/admin" },
        { label: "Administración", href: "/admin/settings/users" },
        { label: "Integraciones" },
      ]}
    >
      <StorageIntegrationsClient />
    </AdminPageFrame>
  );
}
