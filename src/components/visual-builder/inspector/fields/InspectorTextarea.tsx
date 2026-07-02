"use client";

import { Textarea } from "@/components/ui/textarea";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorTextareaProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

export function InspectorTextarea({
  id,
  label,
  hint,
  error,
  disabled,
  required,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: InspectorTextareaProps) {
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
      <Textarea
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-required={required}
      />
    </InspectorFieldFrame>
  );
}
