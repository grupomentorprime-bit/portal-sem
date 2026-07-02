"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { InspectorFieldFrame } from "../shared";
import type { InspectorDevice, InspectorFieldBaseProps, InspectorResponsiveVisibility } from "../types";

export interface InspectorResponsiveProps extends InspectorFieldBaseProps {
  value: InspectorResponsiveVisibility;
  onChange: (value: InspectorResponsiveVisibility) => void;
}

const DEVICES: Array<{ id: InspectorDevice; label: string; icon: typeof Monitor }> = [
  { id: "desktop", label: "Escritorio", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Móvil", icon: Smartphone },
];

export function InspectorResponsive({
  label = "Dispositivos",
  hint = "Elija en qué tamaños de pantalla se muestra este bloque.",
  value,
  onChange,
  disabled,
  error,
  id,
}: InspectorResponsiveProps) {
  const toggle = (device: InspectorDevice) => {
    onChange({ ...value, [device]: !value[device] });
  };

  return (
    <InspectorFieldFrame id={id} label={label} hint={hint} error={error} disabled={disabled}>
      <div className="flex gap-2">
        {DEVICES.map((device) => {
          const Icon = device.icon;
          const active = value[device.id];
          return (
            <button
              key={device.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(device.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition",
                focusRing,
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:bg-background-muted"
              )}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {device.label}
            </button>
          );
        })}
      </div>
    </InspectorFieldFrame>
  );
}
