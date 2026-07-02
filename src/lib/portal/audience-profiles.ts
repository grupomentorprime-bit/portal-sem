import type { AudienceProfileItem } from "@/components/portal/home/audience";

export function parseAudienceProfiles(raw: unknown): AudienceProfileItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => ({
      id: String(item.id ?? `profile-${index + 1}`),
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      icon: item.icon ? String(item.icon) : undefined,
      href: item.href ? String(item.href) : undefined,
      visible: item.visible !== false,
      featured: item.featured === true,
    }))
    .filter((item) => item.title.trim());
}
