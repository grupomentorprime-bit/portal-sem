"use client";

import { cn } from "@/lib/utils";
import type { ProgramPremiumFilter } from "@/lib/portal/program-premium-config";
import { DEFAULT_PREMIUM_PROGRAM_FILTERS } from "@/lib/portal/program-premium-config";

interface ProgramFiltersProps {
  filters?: ProgramPremiumFilter[];
  activeFilterId: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export function ProgramFilters({
  filters = DEFAULT_PREMIUM_PROGRAM_FILTERS,
  activeFilterId,
  onFilterChange,
  className,
}: ProgramFiltersProps) {
  return (
    <div
      className={cn("programs-premium__filters", className)}
      role="toolbar"
      aria-label="Filtrar programas formativos"
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={cn(
            "programs-premium__filter",
            activeFilterId === filter.id && "programs-premium__filter--active"
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
