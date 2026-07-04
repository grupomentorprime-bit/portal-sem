"use client";

import { cn } from "@/lib/utils";

export interface SavedFilter {
  id: string;
  label: string;
}

export interface SavedFiltersProps {
  filters: SavedFilter[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/** Lista de filtros guardados (presentacional). */
export function SavedFilters({ filters, activeId, onSelect, className }: SavedFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            f.id === activeId
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted hover:border-secondary hover:text-foreground"
          )}
          onClick={() => onSelect(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
