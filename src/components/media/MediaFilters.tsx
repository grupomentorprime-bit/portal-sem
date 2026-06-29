"use client";

import { MEDIA_CATEGORIES, MEDIA_FOLDERS } from "@/types/media";
import { Label } from "@/components/ui";

export interface MediaFilterState {
  folder?: string;
  category?: string;
  search?: string;
  sort?: "name" | "date" | "size" | "type";
  direction?: "asc" | "desc";
  visibility?: "active" | "trash";
}

interface MediaFiltersProps {
  filters: MediaFilterState;
  onChange: (filters: MediaFilterState) => void;
}

export function MediaFilters({ filters, onChange }: MediaFiltersProps) {
  const update = (patch: Partial<MediaFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Label className="mb-1 block text-xs">Carpeta</Label>
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          value={filters.folder ?? ""}
          onChange={(e) => update({ folder: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {MEDIA_FOLDERS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="mb-1 block text-xs">Categoría</Label>
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          value={filters.category ?? ""}
          onChange={(e) => update({ category: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {MEDIA_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="mb-1 block text-xs">Orden</Label>
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          value={`${filters.sort ?? "date"}-${filters.direction ?? "desc"}`}
          onChange={(e) => {
            const [sort, direction] = e.target.value.split("-") as [MediaFilterState["sort"], MediaFilterState["direction"]];
            update({ sort, direction });
          }}
        >
          <option value="date-desc">Fecha ↓</option>
          <option value="date-asc">Fecha ↑</option>
          <option value="name-asc">Nombre A-Z</option>
          <option value="name-desc">Nombre Z-A</option>
          <option value="size-desc">Peso ↓</option>
          <option value="type-asc">Tipo</option>
        </select>
      </div>
      <div>
        <Label className="mb-1 block text-xs">Estado</Label>
        <select
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          value={filters.visibility ?? "active"}
          onChange={(e) => update({ visibility: e.target.value as "active" | "trash" })}
        >
          <option value="active">Activos</option>
          <option value="trash">Papelera</option>
        </select>
      </div>
    </div>
  );
}
