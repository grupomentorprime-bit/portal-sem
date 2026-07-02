"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/config/ColorPicker";
import { HeroPortalPanel } from "@/components/config/HeroPortalPanel";
import { LogoUploader, FaviconUploader } from "@/components/config/ImageUploader";
import type { Branding } from "@/types/cms";
import type { HeroPortalConfig } from "@/types/hero-portal";

interface BrandingPanelProps {
  value: Branding;
  onChange: (value: Branding) => void;
  heroPortal: HeroPortalConfig;
  onHeroPortalChange: (value: HeroPortalConfig) => void;
  tenant: string;
}

export function BrandingPanel({
  value,
  onChange,
  heroPortal,
  onHeroPortalChange,
  tenant,
}: BrandingPanelProps) {
  const update = <K extends keyof Branding>(key: K, fieldValue: Branding[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidad visual</CardTitle>
          <CardDescription>Logotipos y favicon del portal.</CardDescription>
        </CardHeader>
        <div className="space-y-6">
          <LogoUploader
            value={value.logoMediaId ?? ""}
            onChange={(v) => update("logoMediaId", v)}
            tenant={tenant}
          />
          <FaviconUploader
            value={value.faviconMediaId ?? ""}
            onChange={(v) => update("faviconMediaId", v)}
            tenant={tenant}
          />
        </div>
      </Card>

      <HeroPortalPanel value={heroPortal} onChange={onHeroPortalChange} tenant={tenant} />

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
