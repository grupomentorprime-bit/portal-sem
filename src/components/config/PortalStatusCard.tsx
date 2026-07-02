"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminUi } from "@/lib/admin/admin-ui";
import { cn } from "@/lib/utils";
import type { Institution, SiteConfig } from "@/types/cms";

interface PortalStatusCardProps {
  institution: Institution;
  config: SiteConfig;
  onStatusChange: (status: Institution["status"]) => void;
}

const statusOptions: Array<{
  value: Institution["status"];
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "active",
    label: "Activo",
    description: "El portal es visible y accesible públicamente.",
    color: adminUi.statusActive,
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    description: "El portal muestra modo mantenimiento. SEO desindexado.",
    color: adminUi.statusWarning,
  },
  {
    value: "inactive",
    label: "Inactivo",
    description: "Portal deshabilitado. No indexable por buscadores.",
    color: adminUi.statusDanger,
  },
];

export function PortalStatusCard({
  institution,
  config,
  onStatusChange,
}: PortalStatusCardProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado del portal</CardTitle>
          <CardDescription>
            Controla la disponibilidad pública del sitio institucional.
          </CardDescription>
        </CardHeader>

        <div className="grid gap-3">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition",
                institution.status === option.value
                  ? option.color
                  : adminUi.statusIdle
              )}
            >
              <p className={cn("font-medium", adminUi.metaValue)}>{option.label}</p>
              <p className={cn("mt-1 text-sm", adminUi.mutedText)}>
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadatos del sistema</CardTitle>
          <CardDescription>Información de auditoría del documento cms_config.</CardDescription>
        </CardHeader>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <MetaItem label="ID documento" value={config._id} />
          <MetaItem label="Tenant" value={institution.tenant} />
          <MetaItem label="Creado" value={formatDate(config.createdAt)} />
          <MetaItem label="Última actualización" value={formatDate(config.updatedAt)} />
        </dl>
      </Card>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-lg border p-3", adminUi.card)}>
      <dt className={adminUi.metaLabel}>{label}</dt>
      <dd className={adminUi.metaValue}>{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
