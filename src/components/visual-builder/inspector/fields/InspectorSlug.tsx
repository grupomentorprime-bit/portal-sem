"use client";

import { InspectorTextField } from "./InspectorTextField";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorSlugProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
}

/**
 * Dirección web amigable (sin exponer el término "slug" al usuario en la UI).
 */
export function InspectorSlug({
  label = "Dirección web",
  hint = "Fragmento de URL para enlazar esta sección. Use solo letras minúsculas y guiones.",
  value,
  onChange,
  prefix = "#",
  ...rest
}: InspectorSlugProps) {
  const normalized = value.replace(/[^a-z0-9-]/gi, "").toLowerCase();

  return (
    <div className="space-y-1.5">
      <InspectorTextField
        {...rest}
        label={label}
        hint={hint}
        value={normalized}
        onChange={onChange}
        placeholder="ejemplo-seccion"
      />
      <p className="text-xs text-muted">
        Vista previa: {prefix}
        {normalized || "…"}
      </p>
    </div>
  );
}
