"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { reorderBlocks } from "@/lib/cms/page-utils";
import type { BlockDefinition, PageBlock } from "@/types/page";

interface SortableBlocksProps {
  blocks: PageBlock[];
  blockLibrary: BlockDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (blocks: PageBlock[]) => void;
}

export function SortableBlocks({
  blocks,
  blockLibrary,
  selectedId,
  onSelect,
  onChange,
}: SortableBlocksProps) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getName = (type: string) =>
    blockLibrary.find((b) => b._id === type)?.name ?? type;

  const handleDrop = (targetId: string) => {
    if (!draggedId) return;
    onChange(reorderBlocks(blocks, draggedId, targetId, "after"));
    setDraggedId(null);
  };

  return (
    <div className="space-y-2">
      {sorted.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border p-8 text-center text-caption text-muted">
          Sin bloques. Agrega uno desde la paleta.
        </p>
      ) : (
        sorted.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDraggedId(block.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(block.id)}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] border bg-background px-3 py-3 transition",
              selectedId === block.id
                ? "border-secondary shadow-[var(--shadow-sm)]"
                : "border-border",
              !block.visible && "opacity-50",
              draggedId === block.id && "opacity-40"
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" strokeWidth={2} />
            <button
              type="button"
              onClick={() => onSelect(block.id)}
              className="flex-1 text-left"
            >
              <span className="text-body font-medium text-foreground">
                {getName(block.type)}
              </span>
              {!block.visible ? (
                <span className="ml-2 text-caption text-muted">(oculto)</span>
              ) : null}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
