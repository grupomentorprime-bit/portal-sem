"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdmissionSortableList } from "@/components/admin/admission/AdmissionSortableList";
import { createCmsId } from "@/types/cms-shared";

export interface BuilderItem {
  id: string;
  label: string;
  subtitle?: string;
}

interface BuilderShellProps<T extends BuilderItem> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
  children: React.ReactNode;
}

export function BuilderShell<T extends BuilderItem>({
  items,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onRemove,
  addLabel = "Agregar",
  children,
}: BuilderShellProps<T>) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <AdmissionSortableList
          items={items.map((item) => ({
            id: item.id,
            label: item.label,
            subtitle: item.subtitle,
          }))}
          selectedId={selectedId}
          onSelect={onSelect}
          onReorder={onReorder}
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="w-full">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          {addLabel}
        </Button>
        {selectedId ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(selectedId)}
            className="w-full text-[var(--color-danger)]"
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
            Eliminar seleccionado
          </Button>
        ) : null}
      </div>
      <div className="rounded-xl border border-border bg-background p-5">{children}</div>
    </div>
  );
}

export function reorderBuilderItems<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string
): T[] {
  const from = items.findIndex((i) => i.id === draggedId);
  const to = items.findIndex((i) => i.id === targetId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export { createCmsId };
