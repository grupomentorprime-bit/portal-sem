import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HelpSettingsPage() {
  return (
    <AdminPageFrame
      title="Centro de ayuda"
      description="Guías para administrar el portal institucional"
      backHref="/admin"
      backLabel="Volver al inicio"
    >
      <div className="space-y-4 text-sm">
        <p className="text-muted">
          Recursos para el equipo del Seminario Eclesiástico Mayor.
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/settings/users" className="text-primary underline">
              Administrar usuarios del CMS
            </Link>
          </li>
          <li>
            <Link href="/admin/config" className="text-primary underline">
              Configuración institucional
            </Link>
          </li>
          <li>
            <Link href="/admin/content" className="text-primary underline">
              Gestionar comunicaciones
            </Link>
          </li>
        </ul>
      </div>
    </AdminPageFrame>
  );
}
