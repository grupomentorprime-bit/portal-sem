"use client";

import { Input, Label } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalTopBarConfig } from "@/types/cms";

interface PortalTopBarFormProps {
  value: PortalTopBarConfig;
  onChange: (value: PortalTopBarConfig) => void;
}

export function PortalTopBarForm({ value, onChange }: PortalTopBarFormProps) {
  const update = <K extends keyof PortalTopBarConfig>(key: K, fieldValue: PortalTopBarConfig[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Barra superior del portal</CardTitle>
        <CardDescription>
          Barra institucional sobre el header: modalidad, contacto y aula virtual.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="rounded border-border"
          />
          Mostrar barra superior
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Etiqueta modalidad</Label>
            <Input
              value={value.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="100% Online"
            />
          </div>

          <div>
            <Label className="mb-2 block">Email</Label>
            <Input
              type="email"
              value={value.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="contacto@seminarioipn.cl"
            />
          </div>

          <div>
            <Label className="mb-2 block">Teléfono</Label>
            <Input
              value={value.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <Label className="mb-2 block">Etiqueta aula virtual</Label>
            <Input
              value={value.virtualCampusLabel}
              onChange={(e) => update("virtualCampusLabel", e.target.value)}
              placeholder="Aula Virtual"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-2 block">URL aula virtual</Label>
            <Input
              value={value.virtualCampusHref}
              onChange={(e) => update("virtualCampusHref", e.target.value)}
              placeholder="https://campus.aprendehoy.cl"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
