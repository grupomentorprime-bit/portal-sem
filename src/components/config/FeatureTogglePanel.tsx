"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { FeatureFlags } from "@/types/cms";

interface FeatureTogglePanelProps {
  value: FeatureFlags;
  onChange: (value: FeatureFlags) => void;
}

const features: Array<{
  key: keyof FeatureFlags;
  label: string;
  description: string;
}> = [
  { key: "blog", label: "Blog", description: "Publicaciones y artículos institucionales." },
  { key: "news", label: "Noticias", description: "Noticias y comunicados oficiales." },
  { key: "events", label: "Eventos", description: "Calendario y actividades del seminario." },
  { key: "store", label: "Tienda", description: "Comercio y productos institucionales." },
  { key: "library", label: "Biblioteca", description: "Recursos y materiales digitales." },
  { key: "forms", label: "Formularios", description: "Formularios de contacto y solicitudes." },
  {
    key: "applications",
    label: "Postulación",
    description: "Proceso de admisión y postulaciones.",
  },
  {
    key: "onlinePayments",
    label: "Pagos en línea",
    description: "Integración con pasarela de pagos.",
  },
];

export function FeatureTogglePanel({ value, onChange }: FeatureTogglePanelProps) {
  const update = (key: keyof FeatureFlags, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funcionalidades del portal</CardTitle>
        <CardDescription>
          Activa o desactiva módulos del ecosistema AprendeHoy.
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {features.map((feature) => (
          <Switch
            key={feature.key}
            label={feature.label}
            description={feature.description}
            checked={value[feature.key]}
            onChange={(checked) => update(feature.key, checked)}
          />
        ))}
      </div>
    </Card>
  );
}
