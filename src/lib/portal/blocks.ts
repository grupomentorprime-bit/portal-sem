import type { PageBlock } from "@/types/page";

export function findBlock(pageBlocks: PageBlock[] | undefined, type: string) {
  return pageBlocks?.find((b) => b.visible && b.type === type);
}

export function blockSettings<T extends Record<string, unknown>>(
  block: PageBlock | undefined
): Partial<T> {
  if (!block?.settings) return {};
  return block.settings as Partial<T>;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export function extractStats(block: PageBlock | undefined): StatItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is StatItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "value" in item &&
        "label" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.label),
      value: String(item.value),
      label: String(item.label),
    }));
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export function extractFeatures(block: PageBlock | undefined): FeatureItem[] {
  const items = block?.settings?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is FeatureItem => {
      return (
        typeof item === "object" &&
        item !== null &&
        "title" in item &&
        "description" in item
      );
    })
    .map((item) => ({
      id: String(item.id ?? item.title),
      title: String(item.title),
      description: String(item.description),
      icon: item.icon ? String(item.icon) : undefined,
    }));
}
