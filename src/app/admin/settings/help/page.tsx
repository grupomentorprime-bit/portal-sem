import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import {
  AdminModuleCenter,
  AdminModuleHero,
  AdminModuleSectionHeader,
} from "@/components/admin/AdminModuleCenter";
import { ADMIN_PANEL_META } from "@/lib/admin/module-panels";
import { BookOpen } from "lucide-react";
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
      <AdminModuleCenter>
        <AdminModuleHero {...ADMIN_PANEL_META.help} />
        <AdminModuleSectionHeader
          icon={BookOpen}
          title="Recursos rápidos"
          description="Enlaces frecuentes para el equipo del Seminario Eclesiástico Mayor."
        />
        <ul className="space-y-2 text-sm">
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
      </AdminModuleCenter>
    </AdminPageFrame>
  );
}
