import type { PageBlock } from "@/types/page";
import type { PortalFeatureItem } from "@/types/feature-grid";

function isVisible(value: unknown): boolean {
  return value !== false;
}

export function extractFeatureGridItems(block: PageBlock | undefined): PortalFeatureItem[] {
  const raw = block?.settings?.features ?? block?.settings?.highlights;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && "title" in item
    )
    .map((item, index) => ({
      id: String(item.id ?? item.title),
      title: String(item.title),
      description: String(item.description ?? ""),
      icon: item.icon ? String(item.icon) : "BookOpen",
      color: item.color ? String(item.color) : undefined,
      order: typeof item.order === "number" ? item.order : index,
      visible: isVisible(item.visible),
      url: item.url ? String(item.url) : undefined,
    }))
    .filter((item) => item.visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
