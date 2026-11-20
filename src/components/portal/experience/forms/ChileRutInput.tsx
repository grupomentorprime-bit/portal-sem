"use client";

import { Input } from "@/components/ui/input";
import {
  CHILE_RUT_EXAMPLE,
  formatChileRutInput,
  normalizeChileRut,
} from "@/lib/experience/forms/rut-chile";

interface ChileRutInputProps {
  label: string;
  name: string;
  value: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function ChileRutInput({
  label,
  name,
  value,
  helper,
  error,
  disabled,
  required,
  onChange,
  onBlur,
}: ChileRutInputProps) {
  const handleChange = (nextValue: string) => {
    onChange(formatChileRutInput(nextValue));
  };

  const handleBlur = () => {
    const normalized = normalizeChileRut(value);
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
    onBlur?.();
  };

  return (
    <Input
      label={label}
      name={name}
      type="text"
      inputMode="text"
      autoComplete="off"
      placeholder={CHILE_RUT_EXAMPLE}
      helper={helper ?? `Formato Chile: ${CHILE_RUT_EXAMPLE}`}
      error={error}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  );
}
