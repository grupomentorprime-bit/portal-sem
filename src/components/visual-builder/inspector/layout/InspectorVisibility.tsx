"use client";

import { InspectorToggle } from "../fields/InspectorToggle";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorVisibilityProps extends InspectorFieldBaseProps {
  visible: boolean;
  onChange: (visible: boolean) => void;
}

export function InspectorVisibility({
  label = "Mostrar en el sitio",
  hint = "Si está desactivado, el bloque no se verá en el portal público.",
  visible,
  onChange,
  ...rest
}: InspectorVisibilityProps) {
  return (
    <InspectorToggle
      {...rest}
      label={label}
      hint={hint}
      checked={visible}
      onChange={onChange}
    />
  );
}
