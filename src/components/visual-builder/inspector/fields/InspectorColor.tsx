"use client";

import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { colorCssVars, colorDefaults } from "@/design/tokens/colors";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

const VAR_TO_HEX: Record<string, string> = {
  [colorCssVars.primary]: colorDefaults.primary,
  [colorCssVars.secondary]: colorDefaults.secondary,
  [colorCssVars.accent]: colorDefaults.accent,
  [colorCssVars.surface]: colorDefaults.surface,
  [colorCssVars.foreground]: colorDefaults.foreground,
};

const PRESET_COLORS = [
  { value: colorCssVars.primary, label: "Institucional" },
  { value: colorCssVars.secondary, label: "Secundario" },
  { value: colorCssVars.surface, label: "Blanco" },
  { value: colorCssVars.foreground, label: "Oscuro" },
] as const;

function toColorInputValue(value: string): string {
  if (value.startsWith("#")) return value;
  return VAR_TO_HEX[value] ?? colorDefaults.primary;
}

export interface InspectorColorProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  presets?: Array<{ value: string; label: string }>;
}

export function InspectorColor({
  id,
  label,
  hint,
  error,
  disabled,
  value,
  onChange,
  presets = [...PRESET_COLORS],
}: InspectorColorProps) {
  const fieldId = inspectorFieldId(label, id);

  return (
    <InspectorFieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      disabled={disabled}
    >
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            title={preset.label}
            disabled={disabled}
            onClick={() => onChange(preset.value)}
            className={cn(
              "h-8 w-8 rounded-full border-2 transition",
              focusRing,
              value === preset.value ? "border-primary ring-2 ring-primary/30" : "border-border"
            )}
            style={{ backgroundColor: preset.value }}
            aria-label={preset.label}
            aria-pressed={value === preset.value}
          />
        ))}
        <label className="relative">
          <span className="sr-only">Color personalizado</span>
          <input
            type="color"
            value={toColorInputValue(value)}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={cn("h-8 w-8 cursor-pointer rounded border border-border", focusRing)}
          />
        </label>
      </div>
    </InspectorFieldFrame>
  );
}
