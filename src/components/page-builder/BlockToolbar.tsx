"use client";

import { Button } from "@/components/ui";
import { duplicateBlock } from "@/lib/cms/page-utils";
import type { PageBlock } from "@/types/page";

interface BlockToolbarProps {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function BlockToolbar({ block, onChange, onDelete, onDuplicate }: BlockToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...block, visible: !block.visible })}
      >
        {block.visible ? "Ocultar" : "Mostrar"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
        Duplicar
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        Eliminar
      </Button>
    </div>
  );
}

export function duplicateBlockInList(blocks: PageBlock[], blockId: string): PageBlock[] {
  return duplicateBlock(blocks, blockId);
}
