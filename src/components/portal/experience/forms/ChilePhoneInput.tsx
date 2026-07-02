"use client";

import { Input } from "@/components/ui/input";
import {
  CHILE_PHONE_EXAMPLE,
  formatChilePhoneInput,
  normalizeChilePhone,
} from "@/lib/experience/forms/phone-chile";

interface ChilePhoneInputProps {
  label: string;
  name: string;
  value: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}

export function ChilePhoneInput({
  label,
  name,
  value,
  helper,
  error,
  disabled,
  required,
  onChange,
}: ChilePhoneInputProps) {
  const handleChange = (nextValue: string) => {
    onChange(formatChilePhoneInput(nextValue));
  };

  const handleBlur = () => {
    const normalized = normalizeChilePhone(value);
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
  };

  return (
    <Input
      label={label}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder={CHILE_PHONE_EXAMPLE}
      helper={helper ?? `Formato Chile: ${CHILE_PHONE_EXAMPLE}`}
      error={error}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
    />
  );
}
