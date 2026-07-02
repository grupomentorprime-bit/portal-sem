import type { AdmissionClosingBlock, AdmissionClosingConfig } from "@/types/admission-closing";
import { DEFAULT_ADMISSION_CLOSING } from "@/lib/portal/admission-closing-defaults";

export function sortClosingBlocks<T extends { order: number }>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

export function reorderClosingBlocks(
  blocks: AdmissionClosingBlock[],
  draggedId: string,
  targetId: string
): AdmissionClosingBlock[] {
  const sorted = sortClosingBlocks(blocks);
  const from = sorted.findIndex((b) => b.id === draggedId);
  const to = sorted.findIndex((b) => b.id === targetId);
  if (from < 0 || to < 0 || from === to) return blocks;

  const next = [...sorted];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((block, index) => ({ ...block, order: index }));
}

export function reorderClosingListItems<T extends { id: string; order: number }>(
  items: T[],
  draggedId: string,
  targetId: string
): T[] {
  const sorted = sortClosingBlocks(items);
  const from = sorted.findIndex((item) => item.id === draggedId);
  const to = sorted.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0 || from === to) return items;

  const next = [...sorted];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((entry, index) => ({ ...entry, order: index }));
}

export function mergeClosingConfig(
  saved?: AdmissionClosingConfig
): AdmissionClosingConfig {
  if (!saved) return DEFAULT_ADMISSION_CLOSING;

  const savedTypes = new Set(saved.blocks.map((block) => block.type));
  const missingDefaults = DEFAULT_ADMISSION_CLOSING.blocks.filter(
    (block) => !savedTypes.has(block.type)
  );

  return {
    ...DEFAULT_ADMISSION_CLOSING,
    ...saved,
    blocks: sortClosingBlocks([...saved.blocks, ...missingDefaults]),
  };
}

export function resolveClosingFooterHref(
  type: string,
  url?: string
): { href: string; external?: boolean } {
  const value = url?.trim() ?? "";
  switch (type) {
    case "email":
      return { href: value.startsWith("mailto:") ? value : `mailto:${value}` };
    case "phone":
      return { href: value.startsWith("tel:") ? value : `tel:${value.replace(/\s/g, "")}` };
    case "file":
    case "url":
    case "page":
    case "program":
    case "news":
    case "library":
    default:
      return { href: value, external: value.startsWith("http") };
  }
}
