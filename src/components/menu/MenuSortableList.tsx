"use client";

import { useState } from "react";
import { MenuBadge } from "@/components/menu/MenuBadge";
import { MenuIcon } from "@/components/menu/menu-icons";
import { cn } from "@/lib/utils";
import { reorderMenuItems } from "@/lib/cms/menu-utils";
import type { MenuItem } from "@/types/menu";

interface MenuSortableListProps {
  items: MenuItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (items: MenuItem[]) => void;
  onDelete: (id: string) => void;
}

export function MenuSortableList({
  items,
  selectedId,
  onSelect,
  onChange,
  onDelete,
}: MenuSortableListProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => {
    if (a.parent !== b.parent) {
      return (a.parent ?? "").localeCompare(b.parent ?? "");
    }
    return a.order - b.order;
  });

  const handleDrop = (targetId: string, position: "before" | "after") => {
    if (!draggedId) return;
    onChange(reorderMenuItems(items, draggedId, targetId, position));
    setDraggedId(null);
  };

  return (
    <div className="space-y-1">
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
          Sin ítems. Agrega el primero con el botón +.
        </p>
      ) : (
        sorted.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id, "after")}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 transition",
              selectedId === item.id
                ? "border-primary bg-background-soft dark:border-gray-100 dark:bg-gray-900"
                : "border-border bg-background dark:border-gray-700 dark:bg-gray-900",
              draggedId === item.id && "opacity-50"
            )}
            style={{ marginLeft: `${item.level * 20}px` }}
          >
            <span className="cursor-grab text-gray-400" title="Arrastrar para reordenar">
              ⠿
            </span>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="flex flex-1 items-center gap-2 text-left text-sm"
            >
              <MenuIcon name={item.icon} />
              <span className="font-medium">{item.title}</span>
              <MenuBadge label={item.badge} color={item.color} highlighted={item.highlighted} />
              {!item.visible || !item.active ? (
                <span className="text-xs text-gray-400">(oculto)</span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded px-2 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--state-danger-bg)] dark:hover:bg-[var(--state-danger-bg)]"
            >
              Eliminar
            </button>
          </div>
        ))
      )}
    </div>
  );
}
