"use client";

import { Switch } from "@/components/ui/switch";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorToggleProps extends Omit<InspectorFieldBaseProps, "loading"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function InspectorToggle({
  id,
  label,
  hint,
  disabled,
  checked,
  onChange,
}: InspectorToggleProps) {
  return (
    <Switch
      id={id}
      label={label}
      description={hint}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
