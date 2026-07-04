"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface FilterChipProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
  className?: string;
}

/** Chip de filtro activo removible. */
export function FilterChip({ label, active = false, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-text-inverse"
          : "border-border bg-background text-foreground hover:bg-background-muted",
        className
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-muted hover:bg-background-muted hover:text-foreground"
          aria-label={`Quitar filtro ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}
