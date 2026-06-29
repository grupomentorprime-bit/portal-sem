"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/config/ColorPicker";
import {
  FaviconUploader,
  HeroUploader,
  LogoUploader,
} from "@/components/config/ImageUploader";
import type { Branding } from "@/types/cms";

interface BrandingPanelProps {
  value: Branding;
  onChange: (value: Branding) => void;
}

export function BrandingPanel({ value, onChange }: BrandingPanelProps) {
  const update = <K extends keyof Branding>(key: K, fieldValue: Branding[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidad visual</CardTitle>
          <CardDescription>Logotipos, favicon e imagen principal del portal.</CardDescription>
        </CardHeader>
        <div className="space-y-6">
          <LogoUploader value={value.logo} onChange={(v) => update("logo", v)} />
          <FaviconUploader value={value.favicon} onChange={(v) => update("favicon", v)} />
          <HeroUploader value={value.heroImage} onChange={(v) => update("heroImage", v)} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paleta de colores</CardTitle>
          <CardDescription>Colores institucionales aplicados al portal.</CardDescription>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorPicker
            label="Color primario"
            value={value.primaryColor}
            onChange={(v) => update("primaryColor", v)}
          />
          <ColorPicker
            label="Color secundario"
            value={value.secondaryColor}
            onChange={(v) => update("secondaryColor", v)}
          />
          <ColorPicker
            label="Color de fondo"
            value={value.backgroundColor}
            onChange={(v) => update("backgroundColor", v)}
          />
          <ColorPicker
            label="Color de texto"
            value={value.textColor}
            onChange={(v) => update("textColor", v)}
          />
        </div>
      </Card>
    </div>
  );
}
