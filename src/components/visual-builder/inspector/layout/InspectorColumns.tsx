"use client";

import { InspectorSelect } from "../fields/InspectorSelect";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorColumnsProps extends InspectorFieldBaseProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function InspectorColumns({
  label = "Columnas",
  hint = "Cantidad de columnas en escritorio.",
  value,
  onChange,
  min = 1,
  max = 4,
  ...rest
}: InspectorColumnsProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => {
    const n = min + i;
    return { value: String(n), label: String(n) };
  });

  return (
    <InspectorSelect
      {...rest}
      label={label}
      hint={hint}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      options={options}
    />
  );
}
