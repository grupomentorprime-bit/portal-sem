"use client";

import { Input } from "@/components/ui/input";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorTextFieldProps extends InspectorFieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url";
  maxLength?: number;
}

export function InspectorTextField({
  id,
  label,
  hint,
  error,
  disabled,
  loading,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: InspectorTextFieldProps) {
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
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        maxLength={maxLength}
        aria-required={required}
      />
    </InspectorFieldFrame>
  );
}
