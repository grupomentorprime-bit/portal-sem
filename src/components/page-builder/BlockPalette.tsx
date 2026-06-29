"use client";

import { Button } from "@/components/ui";
import { createDefaultBlock } from "@/lib/cms/page-defaults";
import { createBlockId } from "@/lib/cms/page-utils";
import type { BlockDefinition, BlockType, PageBlock } from "@/types/page";

interface BlockPaletteProps {
  library: BlockDefinition[];
  onAdd: (block: PageBlock) => void;
}

export function BlockPalette({ library, onAdd }: BlockPaletteProps) {
  const categories = [...new Set(library.map((b) => b.category))];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category}>
          <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-muted">
            {category}
          </p>
          <div className="flex flex-wrap gap-2">
            {library
              .filter((b) => b.category === category && b.enabled)
              .map((def) => (
                <Button
                  key={def._id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const block = createDefaultBlock(def._id as BlockType, 0);
                    block.id = createBlockId(def._id);
                    onAdd(block);
                  }}
                >
                  + {def.name}
                </Button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
