"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { InspectorFieldFrame } from "../shared";
import type { InspectorAlignmentValue, InspectorFieldBaseProps } from "../types";

export interface InspectorAlignmentProps extends InspectorFieldBaseProps {
  value: InspectorAlignmentValue;
  onChange: (value: InspectorAlignmentValue) => void;
}

const OPTIONS: Array<{
  value: InspectorAlignmentValue;
  label: string;
  icon: typeof AlignLeft;
}> = [
  { value: "left", label: "Izquierda", icon: AlignLeft },
  { value: "center", label: "Centro", icon: AlignCenter },
  { value: "right", label: "Derecha", icon: AlignRight },
];

export function InspectorAlignment({
  label = "Alineación",
  hint,
  error,
  disabled,
  value,
  onChange,
  id,
}: InspectorAlignmentProps) {
  return (
    <InspectorFieldFrame id={id} label={label} hint={hint} error={error} disabled={disabled}>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg border py-2 transition",
                focusRing,
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:bg-background-muted"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="sr-only">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </InspectorFieldFrame>
  );
}
