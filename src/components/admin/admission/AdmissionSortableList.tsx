"use client";

import { GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface SortableListItem {
  id: string;
  label: string;
  subtitle?: string;
  enabled?: boolean;
}

interface AdmissionSortableListProps {
  items: SortableListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onToggleEnabled?: (id: string) => void;
  compact?: boolean;
}

export function AdmissionSortableList({
  items,
  selectedId,
  onSelect,
  onReorder,
  onToggleEnabled,
  compact = false,
}: AdmissionSortableListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => setDraggedId(item.id)}
          onDragEnd={() => setDraggedId(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (draggedId) onReorder(draggedId, item.id);
            setDraggedId(null);
          }}
          className={cn(
            "admission-cms-section-card group flex items-start gap-2 rounded-xl border bg-background transition",
            selectedId === item.id
              ? "border-primary shadow-sm ring-1 ring-primary/15"
              : "border-border hover:border-primary/25",
            item.enabled === false && "opacity-70",
            draggedId === item.id && "opacity-40",
            compact ? "px-2.5 py-2" : "px-3 py-2.5"
          )}
        >
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted group-hover:text-foreground"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block text-sm font-medium text-foreground">{item.label}</span>
            {item.subtitle && !compact ? (
              <span className="mt-0.5 block text-xs leading-snug text-muted">{item.subtitle}</span>
            ) : null}
          </button>
          {onToggleEnabled ? (
            <button
              type="button"
              onClick={() => onToggleEnabled(item.id)}
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition",
                item.enabled === false
                  ? "bg-background-muted text-muted hover:text-foreground"
                  : "bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]"
              )}
              aria-label={item.enabled === false ? `Mostrar ${item.label}` : `Ocultar ${item.label}`}
            >
              {item.enabled === false ? "Oculto" : "Visible"}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
