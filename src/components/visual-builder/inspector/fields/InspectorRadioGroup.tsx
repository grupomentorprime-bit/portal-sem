"use client";

import { RadioGroup } from "@/components/ui/radio";
import { inspectorFieldId } from "../inspector-styles";
import { InspectorFieldFrame } from "../shared";
import type { InspectorFieldBaseProps } from "../types";

export interface InspectorRadioGroupProps extends InspectorFieldBaseProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
}

export function InspectorRadioGroup({
  id,
  label,
  hint,
  error,
  disabled,
  required,
  name,
  value,
  onChange,
  options,
}: InspectorRadioGroupProps) {
  const fieldId = inspectorFieldId(label, id);
  const groupName = name ?? fieldId;

  return (
    <InspectorFieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      disabled={disabled}
      required={required}
    >
      <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
        <RadioGroup
          name={groupName}
          value={value}
          onChange={onChange}
          options={options}
        />
      </fieldset>
    </InspectorFieldFrame>
  );
}
