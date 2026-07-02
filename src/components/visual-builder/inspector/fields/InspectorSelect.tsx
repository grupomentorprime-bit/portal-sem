"use client";

import { Select } from "@/components/ui/select";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorSelectProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function InspectorSelect({
  id,
  label,
  hint,
  error,
  disabled,
  required,
  value,
  onChange,
  options,
  placeholder,
}: InspectorSelectProps) {
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
      <Select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
    </InspectorFieldFrame>
  );
}
