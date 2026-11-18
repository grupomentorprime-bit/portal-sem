"use client";

import { Input, type InputProps } from "@/components/ui";
import {
  formatClpInput,
  parseClpInput,
} from "@/components/admin/congress/labels";
import { CONGRESS_CONTRIBUTION_CLP } from "@/core/congress/constants";

type ClpAmountInputProps = Omit<
  InputProps,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
};

export function ClpAmountInput({
  value,
  onValueChange,
  placeholder,
  ...props
}: ClpAmountInputProps) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder ?? formatClpInput(CONGRESS_CONTRIBUTION_CLP)}
      value={formatClpInput(value)}
      onChange={(event) => {
        const raw = event.target.value;
        if (!raw.trim()) {
          onValueChange(null);
          return;
        }
        const parsed = parseClpInput(raw);
        onValueChange(parsed > 0 ? parsed : null);
      }}
    />
  );
}
