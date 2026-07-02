"use client";

import { InspectorTextField } from "./InspectorTextField";
import { InspectorToggle } from "./InspectorToggle";
import type { InspectorFieldBaseProps, InspectorLinkValue } from "../types";

export interface InspectorLinkProps extends InspectorFieldBaseProps {
  value: InspectorLinkValue;
  onChange: (value: InspectorLinkValue) => void;
  tenant?: string;
}

/**
 * Enlace con etiqueta visible. Para páginas internas use rutas como `/programas`.
 * @example
 * <InspectorLink label="Botón principal" value={cta} onChange={setCta} />
 */
export function InspectorLink({
  value,
  onChange,
  label = "Enlace",
  hint = "Texto del botón y destino dentro del portal.",
  ...rest
}: InspectorLinkProps) {
  return (
    <div className="space-y-4">
      <InspectorTextField
        {...rest}
        label="Texto del enlace"
        value={value.label}
        onChange={(labelText) => onChange({ ...value, label: labelText })}
      />
      <InspectorTextField
        {...rest}
        label="Destino"
        hint={hint}
        value={value.href}
        onChange={(href) => onChange({ ...value, href })}
        placeholder="/programas o https://…"
      />
      <InspectorToggle
        label="Abrir en nueva pestaña"
        checked={value.openInNewTab ?? false}
        onChange={(openInNewTab) => onChange({ ...value, openInNewTab })}
        disabled={rest.disabled}
      />
    </div>
  );
}
