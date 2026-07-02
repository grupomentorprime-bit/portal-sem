import type { ContactMapProvider, PortalContactMapView } from "@/types/contact-hub";

export function buildMapQuery(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(", ");
}

export function resolveMapEmbedUrl(
  provider: ContactMapProvider,
  query: string
): string {
  const encoded = encodeURIComponent(query);

  switch (provider) {
    case "openstreetmap":
      return `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-90%2C180%2C90&layer=mapnik&marker=0%2C0#map=15/0/0&query=${encoded}`;
    case "apple":
      return `https://maps.apple.com/?q=${encoded}`;
    case "google":
    default:
      return `https://www.google.com/maps?q=${encoded}&output=embed`;
  }
}

export function buildContactMapView(
  query: string,
  provider: ContactMapProvider = "google"
): PortalContactMapView | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;

  return {
    provider,
    query: trimmed,
    embedUrl: resolveMapEmbedUrl(provider, trimmed),
  };
}
