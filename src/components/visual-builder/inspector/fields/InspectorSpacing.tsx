"use client";

import { InspectorSelect } from "./InspectorSelect";
import type { InspectorFieldBaseProps, InspectorSpacingPreset } from "../types";

const SPACING_OPTIONS: Array<{ value: InspectorSpacingPreset; label: string }> = [
  { value: "none", label: "Sin espacio" },
  { value: "sm", label: "Compacto" },
  { value: "md", label: "Estándar" },
  { value: "lg", label: "Amplio" },
  { value: "xl", label: "Muy amplio" },
];

export interface InspectorSpacingProps extends InspectorFieldBaseProps {
  value: InspectorSpacingPreset;
  onChange: (value: InspectorSpacingPreset) => void;
}

export function InspectorSpacing(props: InspectorSpacingProps) {
  return (
    <InspectorSelect
      {...props}
      label={props.label ?? "Espaciado"}
      hint={props.hint ?? "Separación vertical de la sección en el portal."}
      value={props.value}
      onChange={(v) => props.onChange(v as InspectorSpacingPreset)}
      options={SPACING_OPTIONS}
    />
  );
}
