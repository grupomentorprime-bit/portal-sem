"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProgramHubFilter, ProgramHubSort } from "@/lib/admin/programs-hub-utils";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: Array<{ id: ProgramHubFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "published", label: "Publicados" },
  { id: "draft", label: "Borradores" },
  { id: "admission_open", label: "Admisión abierta" },
  { id: "archived", label: "Archivados" },
];

const SORT_OPTIONS: Array<{ value: ProgramHubSort; label: string }> = [
  { value: "updated_desc", label: "Actualización reciente" },
  { value: "updated_asc", label: "Actualización antigua" },
  { value: "title_asc", label: "Nombre A–Z" },
  { value: "title_desc", label: "Nombre Z–A" },
  { value: "applicants_desc", label: "Más postulantes" },
  { value: "published_desc", label: "Publicación reciente" },
];

interface ProgramHubToolbarProps {
  search: string;
  filter: ProgramHubFilter;
  sort: ProgramHubSort;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: ProgramHubFilter) => void;
  onSortChange: (sort: ProgramHubSort) => void;
}

export function ProgramHubToolbar({
  search,
  filter,
  sort,
  onSearchChange,
  onFilterChange,
  onSortChange,
}: ProgramHubToolbarProps) {
  return (
    <div className="program-hub-toolbar">
      <div className="program-hub-toolbar__search">
        <Search className="program-hub-toolbar__search-icon" aria-hidden />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar programas..."
          aria-label="Buscar programas"
          className="program-hub-toolbar__search-input"
        />
      </div>

      <div className="program-hub-toolbar__filters" role="toolbar" aria-label="Filtrar programas">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              "program-hub-toolbar__filter",
              filter === option.id && "program-hub-toolbar__filter--active"
            )}
            aria-pressed={filter === option.id}
            onClick={() => onFilterChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="program-hub-toolbar__sort">
        <Select
          label="Ordenar"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ProgramHubSort)}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  );
}
