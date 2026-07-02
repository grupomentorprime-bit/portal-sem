"use client";

import { InspectorSelect } from "./InspectorSelect";
import type {
  InspectorFieldBaseProps,
  InspectorTypographySize,
  InspectorTypographyWeight,
} from "../types";

export interface InspectorTypographyValue {
  size: InspectorTypographySize;
  weight: InspectorTypographyWeight;
}

export interface InspectorTypographyProps extends InspectorFieldBaseProps {
  value: InspectorTypographyValue;
  onChange: (value: InspectorTypographyValue) => void;
}

const SIZE_OPTIONS = [
  { value: "sm", label: "Pequeño" },
  { value: "md", label: "Mediano" },
  { value: "lg", label: "Grande" },
  { value: "xl", label: "Destacado" },
];

const WEIGHT_OPTIONS = [
  { value: "normal", label: "Regular" },
  { value: "medium", label: "Medio" },
  { value: "semibold", label: "Semibold" },
];

export function InspectorTypography({
  label = "Tipografía",
  hint = "Tamaño y peso del texto en el portal.",
  value,
  onChange,
  ...rest
}: InspectorTypographyProps) {
  return (
    <div className="space-y-4">
      <InspectorSelect
        {...rest}
        label="Tamaño"
        hint={undefined}
        value={value.size}
        onChange={(size) =>
          onChange({ ...value, size: size as InspectorTypographySize })
        }
        options={SIZE_OPTIONS}
      />
      <InspectorSelect
        {...rest}
        label="Peso"
        hint={hint}
        value={value.weight}
        onChange={(weight) =>
          onChange({ ...value, weight: weight as InspectorTypographyWeight })
        }
        options={WEIGHT_OPTIONS}
      />
    </div>
  );
}
