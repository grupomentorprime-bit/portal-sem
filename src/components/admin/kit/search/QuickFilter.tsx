"use client";

import { cn } from "@/lib/utils";

export interface QuickFilterOption {
  id: string;
  label: string;
}

export interface QuickFilterProps {
  options: QuickFilterOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Filtro rápido tipo segmented control. */
export function QuickFilter({ options, value, onChange, className }: QuickFilterProps) {
  return (
    <div
      className={cn("inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background-soft p-1", className)}
      role="tablist"
      aria-label="Filtro rápido"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-primary text-text-inverse"
                : "text-muted hover:bg-background hover:text-foreground"
            )}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
