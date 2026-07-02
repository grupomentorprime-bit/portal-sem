"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Institution } from "@/types/cms";

interface InstitutionFormProps {
  value: Institution;
  onChange: (value: Institution) => void;
}

export function InstitutionForm({ value, onChange }: InstitutionFormProps) {
  const update = <K extends keyof Institution>(key: K, fieldValue: Institution[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>
          Identidad institucional y datos corporativos del portal.
        </CardDescription>
      </CardHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de la institución">
          <Input
            value={value.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Seminario Eclesiástico Mayor"
          />
        </Field>

        <Field label="Nombre corto">
          <Input
            value={value.shortName}
            onChange={(e) => update("shortName", e.target.value)}
            placeholder="SEM"
          />
        </Field>

        <Field label="Tenant">
          <Input
            value={value.tenant}
            onChange={(e) => update("tenant", e.target.value)}
            placeholder="seminario-ipn"
          />
        </Field>

        <Field label="Organización">
          <Input
            value={value.organization}
            onChange={(e) => update("organization", e.target.value)}
            placeholder="Iglesia Pentecostal Nazareth"
          />
        </Field>

        <Field label="Sitio web" className="sm:col-span-2">
          <Input
            type="url"
            value={value.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://seminarioipn.cl"
          />
        </Field>

        <Field label="Lema institucional" className="sm:col-span-2">
          <Input
            value={value.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            placeholder="Equipando a los santos para la obra del ministerio"
          />
        </Field>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
