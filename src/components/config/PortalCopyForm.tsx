"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortalCopy } from "@/types/cms";

interface PortalCopyFormProps {
  value: PortalCopy;
  onChange: (value: PortalCopy) => void;
}

const fields: Array<{ key: keyof PortalCopy; label: string; placeholder: string }> = [
  { key: "footerProgramsTitle", label: "Título — Oferta académica", placeholder: "Oferta Académica" },
  { key: "footerResourcesTitle", label: "Título — Recursos", placeholder: "Recursos" },
  { key: "footerAdmissionTitle", label: "Título — Admisión", placeholder: "Admisión" },
  { key: "footerContactTitle", label: "Título — Contacto", placeholder: "Contacto" },
  { key: "footerCopyrightSuffix", label: "Sufijo copyright", placeholder: "Todos los derechos reservados." },
  { key: "footerCredits", label: "Créditos (opcional)", placeholder: "Desarrollado con AprendeHoy Learning OS" },
  { key: "footerBackToTopLabel", label: "Botón volver arriba", placeholder: "Volver arriba" },
  { key: "footerAdminLabel", label: "Enlace administración", placeholder: "Administración" },
];

export function PortalCopyForm({ value, onChange }: PortalCopyFormProps) {
  const update = <K extends keyof PortalCopy>(key: K, fieldValue: PortalCopy[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Textos del portal</CardTitle>
        <CardDescription>
          Etiquetas del footer y textos institucionales visibles en el sitio público.
        </CardDescription>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.key === "footerCopyrightSuffix" || field.key === "footerCredits" ? "sm:col-span-2" : undefined}>
            <Label className="mb-2 block">{field.label}</Label>
            <Input
              value={value[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
