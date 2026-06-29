import type { PageBlock } from "@/types/page";

export function sortBlocks(blocks: PageBlock[]): PageBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

export function reorderBlocks(
  blocks: PageBlock[],
  draggedId: string,
  targetId: string,
  position: "before" | "after"
): PageBlock[] {
  const sorted = sortBlocks(blocks);
  const fromIndex = sorted.findIndex((b) => b.id === draggedId);
  const toIndex = sorted.findIndex((b) => b.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return blocks;

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  let insertAt = toIndex;
  if (position === "after") insertAt = toIndex + (fromIndex < toIndex ? 0 : 1);
  if (position === "before") insertAt = toIndex + (fromIndex < toIndex ? -1 : 0);
  next.splice(insertAt, 0, moved);

  return next.map((block, index) => ({ ...block, order: index }));
}

export function duplicateBlock(blocks: PageBlock[], blockId: string): PageBlock[] {
  const source = blocks.find((b) => b.id === blockId);
  if (!source) return blocks;

  const copy: PageBlock = {
    ...source,
    id: `${source.type}-${Date.now()}`,
    settings: JSON.parse(JSON.stringify(source.settings)) as PageBlock["settings"],
    order: blocks.length,
  };

  return sortBlocks([...blocks, copy]).map((b, i) => ({ ...b, order: i }));
}

export function createBlockId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeSlug(slug: string): string {
  if (slug === "/") return "/";
  const trimmed = slug.trim();
  if (!trimmed.startsWith("/")) return `/${trimmed.replace(/^\/+/, "")}`;
  return trimmed.replace(/\/+$/, "") || "/";
}
