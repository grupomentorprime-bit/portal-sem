"use client";

import { InspectorSelect } from "../fields/InspectorSelect";
import type { InspectorFieldBaseProps, InspectorWidthValue } from "../types";

const WIDTH_OPTIONS = [
  { value: "full", label: "Ancho completo" },
  { value: "contained", label: "Contenido estándar" },
  { value: "narrow", label: "Estrecho (lectura)" },
];

export interface InspectorWidthProps extends InspectorFieldBaseProps {
  value: InspectorWidthValue;
  onChange: (value: InspectorWidthValue) => void;
}

export function InspectorWidth({
  label = "Ancho del bloque",
  hint = "Extensión horizontal en la página.",
  value,
  onChange,
  ...rest
}: InspectorWidthProps) {
  return (
    <InspectorSelect
      {...rest}
      label={label}
      hint={hint}
      value={value}
      onChange={(v) => onChange(v as InspectorWidthValue)}
      options={WIDTH_OPTIONS}
    />
  );
}
