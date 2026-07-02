"use client";

import { cn } from "@/lib/utils";
import type { ProgramItem } from "@/types/content";

export interface ProgramFilterChip {
  id: string;
  label: string;
  match: (program: ProgramItem) => boolean;
}

export const DEFAULT_PROGRAM_FILTERS: ProgramFilterChip[] = [
  {
    id: "all",
    label: "Todos",
    match: () => true,
  },
  {
    id: "pastores",
    label: "Pastores",
    match: (p) => /pastor/i.test(p.certification ?? p.category ?? ""),
  },
  {
    id: "online",
    label: "Online",
    match: (p) => /online|100%/i.test(p.modality ?? ""),
  },
  {
    id: "admission",
    label: "Admisión abierta",
    match: (p) => p.status === "admission_open",
  },
];

interface ProgramFilterChipsProps {
  filters?: ProgramFilterChip[];
  activeFilterId: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export function ProgramFilterChips({
  filters = DEFAULT_PROGRAM_FILTERS,
  activeFilterId,
  onFilterChange,
  className,
}: ProgramFilterChipsProps) {
  return (
    <div
      className={cn("program-filter-chips", className)}
      role="toolbar"
      aria-label="Filtrar programas destacados"
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={cn(
            "program-filter-chips__chip",
            activeFilterId === filter.id && "program-filter-chips__chip--active"
          )}
          aria-pressed={activeFilterId === filter.id}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
