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
  hint?: string;
}> = [
  {
    key: "blog",
    label: "Blog",
    description: "Publicaciones y artículos institucionales.",
    hint: "Reservado — aún no hay sección pública /blog.",
  },
  {
    key: "news",
    label: "Noticias",
    description: "Noticias, menú, bloques y ruta /noticias.",
  },
  {
    key: "events",
    label: "Eventos",
    description: "Eventos, menú, bloques y ruta /eventos.",
  },
  {
    key: "academicAgenda",
    label: "Agenda académica",
    description: "Agenda, bloques y ruta /agenda-academica.",
  },
  {
    key: "institutionalNotices",
    label: "Avisos institucionales",
    description: "Avisos, bloques y ruta /avisos.",
  },
  {
    key: "store",
    label: "Tienda",
    description: "Comercio y productos institucionales.",
    hint: "Reservado — aún no hay sección pública /tienda.",
  },
  {
    key: "library",
    label: "Biblioteca",
    description: "Biblioteca, menú, bloques y ruta /biblioteca.",
  },
  {
    key: "forms",
    label: "Formularios",
    description: "Formularios de contacto y ruta /formularios.",
  },
  {
    key: "applications",
    label: "Postulación",
    description: "Admisión, botón postular, bloques y rutas /admision y /postulacion.",
  },
  {
    key: "onlinePayments",
    label: "Pagos en línea",
    description: "Integración con pasarela de pagos.",
    hint: "Reservado — el portal aún no procesa pagos.",
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
          Activa o desactiva secciones visibles en el portal público: menús, rutas, bloques del
          Experience Studio y accesos del centro editorial.
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {features.map((feature) => (
          <div key={feature.key} className="space-y-1">
            <Switch
              label={feature.label}
              description={feature.description}
              checked={value[feature.key]}
              onChange={(checked) => update(feature.key, checked)}
            />
            {feature.hint ? (
              <p className="pl-1 text-xs text-muted">{feature.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
