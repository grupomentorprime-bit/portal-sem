"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    color: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    description: "El portal muestra modo mantenimiento. SEO desindexado.",
    color: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
  },
  {
    value: "inactive",
    label: "Inactivo",
    description: "Portal deshabilitado. No indexable por buscadores.",
    color: "border-red-500 bg-red-50 dark:bg-red-950/30",
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
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              )}
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{option.label}</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
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
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
