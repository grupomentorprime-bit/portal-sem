"use client";

import { cn } from "@/lib/utils";

export type MediaQuickFilterId =
  | "all"
  | "images"
  | "videos"
  | "documents"
  | "favorites"
  | "inUse"
  | "noUse"
  | "trash";

const FILTERS: { id: MediaQuickFilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "images", label: "Imágenes" },
  { id: "videos", label: "Videos" },
  { id: "documents", label: "Documentos" },
  { id: "favorites", label: "Favoritos" },
  { id: "inUse", label: "En uso" },
  { id: "noUse", label: "Sin uso" },
  { id: "trash", label: "Papelera" },
];

interface MediaQuickFiltersProps {
  active: MediaQuickFilterId;
  onChange: (id: MediaQuickFilterId) => void;
}

export function MediaQuickFilters({ active, onChange }: MediaQuickFiltersProps) {
  return (
    <div className="media-quick-filters flex flex-wrap gap-2" role="tablist" aria-label="Filtros rápidos">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={active === f.id}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
            active === f.id
              ? "border-secondary bg-secondary text-secondary-foreground"
              : "border-border bg-background text-muted hover:border-secondary/50 hover:text-foreground"
          )}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function quickFilterToState(id: MediaQuickFilterId): {
  category?: string;
  favorite?: boolean;
  usageFilter?: "inUse" | "noUse";
  visibility?: "active" | "trash";
} {
  switch (id) {
    case "images":
      return { visibility: "active" as const, category: "Imagen", favorite: undefined, usageFilter: undefined };
    case "videos":
      return { visibility: "active" as const, category: "Video", favorite: undefined, usageFilter: undefined };
    case "documents":
      return { visibility: "active" as const, category: "Documento", favorite: undefined, usageFilter: undefined };
    case "favorites":
      return { visibility: "active" as const, favorite: true, category: undefined, usageFilter: undefined };
    case "inUse":
      return { visibility: "active" as const, usageFilter: "inUse" as const, category: undefined, favorite: undefined };
    case "noUse":
      return { visibility: "active" as const, usageFilter: "noUse" as const, category: undefined, favorite: undefined };
    case "trash":
      return { visibility: "trash" as const, category: undefined, favorite: undefined, usageFilter: undefined };
    default:
      return {
        visibility: "active" as const,
        category: undefined,
        favorite: undefined,
        usageFilter: undefined,
      };
  }
}

export function stateToQuickFilter(filters: {
  category?: string;
  favorite?: boolean;
  usageFilter?: "inUse" | "noUse";
  visibility?: "active" | "trash";
}): MediaQuickFilterId {
  if (filters.visibility === "trash") return "trash";
  if (filters.favorite) return "favorites";
  if (filters.usageFilter === "inUse") return "inUse";
  if (filters.usageFilter === "noUse") return "noUse";
  if (filters.category === "Imagen") return "images";
  if (filters.category === "Video") return "videos";
  if (filters.category === "Documento") return "documents";
  return "all";
}
