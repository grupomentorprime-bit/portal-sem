"use client";

import { Input } from "@/components/ui/input";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorDateProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

export function InspectorDate({
  id,
  label,
  hint,
  error,
  disabled,
  required,
  value,
  onChange,
  min,
  max,
}: InspectorDateProps) {
  const fieldId = inspectorFieldId(label, id);

  return (
    <InspectorFieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      disabled={disabled}
      required={required}
    >
      <Input
        id={fieldId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={min}
        max={max}
        aria-required={required}
      />
    </InspectorFieldFrame>
  );
}
