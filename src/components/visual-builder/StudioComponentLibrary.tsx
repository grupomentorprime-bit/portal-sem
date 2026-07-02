"use client";

import { BlockIcon } from "@/components/portal/BlockIcon";
import { createDefaultBlock } from "@/lib/cms/page-defaults";
import { createBlockId } from "@/lib/cms/page-utils";
import {
  buildComponentRegistry,
  listStudioCategories,
  type StudioComponentEntry,
} from "@/lib/experience-studio/registry";
import type { BlockDefinition, PageBlock } from "@/types/page";
import { SortableBlocks } from "@/components/page-builder/SortableBlocks";
import { useMemo, useState } from "react";

interface StudioComponentLibraryProps {
  blocks: PageBlock[];
  blockLibrary: BlockDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBlocksChange: (blocks: PageBlock[]) => void;
  onAddBlock: (block: PageBlock) => void;
}

export function StudioComponentLibrary({
  blocks,
  blockLibrary,
  selectedId,
  onSelect,
  onBlocksChange,
  onAddBlock,
}: StudioComponentLibraryProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"canvas" | "library">("canvas");

  const registry = useMemo(
    () => buildComponentRegistry(blockLibrary).filter((entry) => !entry.adminOnly),
    [blockLibrary]
  );

  const categories = useMemo(() => listStudioCategories(registry), [registry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return registry;
    return registry.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.categoryLabel.toLowerCase().includes(q)
    );
  }, [registry, query]);

  const addComponent = (entry: StudioComponentEntry) => {
    const block = createDefaultBlock(entry.type, blocks.length);
    block.id = createBlockId(entry.type);
    onAddBlock(block);
    setTab("canvas");
  };

  return (
    <aside className="experience-studio__sidebar flex h-full flex-col border-r border-border bg-background">
      <div className="border-b border-border p-3">
        <div className="mb-2 flex gap-1 rounded-lg bg-background-soft p-1">
          <button
            type="button"
            onClick={() => setTab("canvas")}
            className={tab === "canvas" ? "flex-1 rounded-md bg-background px-2 py-1.5 text-xs font-medium" : "flex-1 rounded-md px-2 py-1.5 text-xs text-muted"}
          >
            Estructura
          </button>
          <button
            type="button"
            onClick={() => setTab("library")}
            className={tab === "library" ? "flex-1 rounded-md bg-background px-2 py-1.5 text-xs font-medium" : "flex-1 rounded-md px-2 py-1.5 text-xs text-muted"}
          >
            Componentes
          </button>
        </div>
        {tab === "library" ? (
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar componente…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "canvas" ? (
          <SortableBlocks
            blocks={blocks}
            blockLibrary={blockLibrary}
            selectedId={selectedId}
            onSelect={onSelect}
            onChange={onBlocksChange}
          />
        ) : (
          <div className="space-y-5">
            {categories.map((category) => {
              const items = filtered.filter((entry) => entry.category === category.id);
              if (items.length === 0) return null;
              return (
                <section key={category.id}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {category.label}
                  </h3>
                  <div className="space-y-2">
                    {items.map((entry) => (
                      <button
                        key={entry.type}
                        type="button"
                        className="studio-library__item"
                        onClick={() => addComponent(entry)}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <BlockIcon name={entry.icon} className="h-4 w-4 text-primary" aria-hidden />
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted">{entry.description}</span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
