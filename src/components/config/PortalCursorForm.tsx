"use client";

import { ColorPicker } from "@/components/config/ColorPicker";
import { Label } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalCursorConfig } from "@/types/cms";

interface PortalCursorFormProps {
  value: PortalCursorConfig;
  onChange: (value: PortalCursorConfig) => void;
}

export function PortalCursorForm({ value, onChange }: PortalCursorFormProps) {
  const update = <K extends keyof PortalCursorConfig>(key: K, fieldValue: PortalCursorConfig[K]) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cursor Premium</CardTitle>
          <CardDescription>
            Experiencia visual del portal: cursor corporativo con estados, magnetismo y ripple.
          </CardDescription>
        </CardHeader>

        <div className="space-y-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="rounded border-border"
            />
            Activar cursor premium
          </label>

          <div>
            <Label className="mb-2 block">Modo</Label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={value.mode}
              onChange={(e) => update("mode", e.target.value as PortalCursorConfig["mode"])}
            >
              <option value="premium">Premium (corporativo)</option>
              <option value="classic">Clásico (sistema)</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker
              label="Color principal"
              value={value.primaryColor}
              onChange={(primaryColor) => update("primaryColor", primaryColor)}
            />
            <ColorPicker
              label="Color secundario"
              value={value.secondaryColor}
              onChange={(secondaryColor) => update("secondaryColor", secondaryColor)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Tamaño ({value.size}px)</Label>
              <input
                type="range"
                min={16}
                max={56}
                step={1}
                value={value.size}
                onChange={(e) => update("size", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-2 block">Opacidad ({Math.round(value.opacity * 100)}%)</Label>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.01}
                value={value.opacity}
                onChange={(e) => update("opacity", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-2 block">Velocidad ({value.speed.toFixed(2)})</Label>
              <input
                type="range"
                min={0.08}
                max={0.45}
                step={0.01}
                value={value.speed}
                onChange={(e) => update("speed", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label className="mb-2 block">Magnetismo ({Math.round(value.magnetStrength * 100)}%)</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={value.magnetStrength}
                onChange={(e) => update("magnetStrength", Number(e.target.value))}
                className="w-full"
                disabled={!value.magnetism}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.glow}
                onChange={(e) => update("glow", e.target.checked)}
                className="rounded border-border"
              />
              Glow
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.magnetism}
                onChange={(e) => update("magnetism", e.target.checked)}
                className="rounded border-border"
              />
              Magnetismo en CTAs
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.ripple}
                onChange={(e) => update("ripple", e.target.checked)}
                className="rounded border-border"
              />
              Ripple al clic
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.animations}
                onChange={(e) => update("animations", e.target.checked)}
                className="rounded border-border"
              />
              Animaciones de estado
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={value.showOnMobile}
                onChange={(e) => update("showOnMobile", e.target.checked)}
                className="rounded border-border"
              />
              Mostrar en móvil (no recomendado)
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>Aproximación visual con la configuración actual.</CardDescription>
        </CardHeader>
        <div
          className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-border"
          style={{
            background:
              "linear-gradient(135deg, var(--sem-primary) 0%, var(--sem-secondary) 100%)",
            ["--cursor-primary" as string]: value.primaryColor,
            ["--cursor-secondary" as string]: value.secondaryColor,
            ["--cursor-size" as string]: `${Math.max(24, value.size * 0.85)}px`,
            ["--cursor-opacity" as string]: String(value.opacity),
          }}
        >
          <div className="relative">
            <div
              className="rounded-full border-2"
              style={{
                width: "var(--cursor-size)",
                height: "var(--cursor-size)",
                borderColor: value.primaryColor,
                opacity: value.opacity,
                boxShadow: value.glow ? `0 0 18px ${value.primaryColor}66` : undefined,
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: value.primaryColor }}
            />
          </div>
          <p className="absolute bottom-3 text-xs text-white/60">
            {value.mode === "premium" && value.enabled ? "Cursor premium activo" : "Cursor clásico"}
          </p>
        </div>
      </Card>
    </div>
  );
}
