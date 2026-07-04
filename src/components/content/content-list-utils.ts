import type { StatusBadgeTone } from "@/components/admin/kit/states/StatusBadge";
import type { ContentDocument } from "@/types/content";

export type ContentStatusFilter = "all" | "published" | "draft" | "archived";

export function getItemLabel(item: ContentDocument, collection: string): string {
  if (collection === "academy_categories") {
    return (item as { name?: string }).name ?? item.title ?? item._id;
  }
  if (collection === "academy_testimonials") {
    return item.author ?? item.title ?? item._id;
  }
  return item.title ?? item.name ?? item._id;
}

export function getItemSubtitle(item: ContentDocument, collection: string): string {
  const parts: string[] = [];

  if (collection === "academy_categories") {
    const enabled = (item as { enabled?: boolean }).enabled;
    parts.push(enabled === false ? "inactiva" : "activa");
    if (item.order !== undefined) parts.push(`orden ${item.order}`);
    parts.push(item.slug);
    return parts.join(" · ");
  }

  if (item.status) parts.push(item.status);
  if (collection === "academy_programs" && item.modality) parts.push(item.modality);
  if (collection === "content_news" && item.category) parts.push(item.category);
  if (collection === "content_events" && item.location) parts.push(item.location);
  if (collection === "content_library" && item.author) parts.push(item.author);
  if (collection === "academy_testimonials" && item.role) parts.push(item.role);
  parts.push(item.slug || item._id);
  return parts.join(" · ");
}

export function getContentStatusTone(
  item: ContentDocument,
  collection: string
): { tone: StatusBadgeTone; label: string } {
  if (collection === "academy_categories") {
    const enabled = (item as { enabled?: boolean }).enabled;
    return enabled === false
      ? { tone: "inactive", label: "Inactiva" }
      : { tone: "active", label: "Activa" };
  }

  switch (item.status) {
    case "published":
      return { tone: "active", label: "Publicado" };
    case "draft":
      return { tone: "draft", label: "Borrador" };
    case "archived":
      return { tone: "inactive", label: "Archivado" };
    default:
      return { tone: "neutral", label: item.status ?? "—" };
  }
}

export function isPublishedItem(item: ContentDocument, collection: string): boolean {
  if (collection === "academy_categories") {
    return (item as { enabled?: boolean }).enabled !== false;
  }
  return item.status === "published";
}

export function isDraftItem(item: ContentDocument, collection: string): boolean {
  if (collection === "academy_categories") {
    return (item as { enabled?: boolean }).enabled === false;
  }
  return item.status === "draft" || !item.status;
}

export function matchesStatusFilter(
  item: ContentDocument,
  collection: string,
  filter: ContentStatusFilter
): boolean {
  if (filter === "all") return true;
  if (collection === "academy_categories") {
    const enabled = (item as { enabled?: boolean }).enabled !== false;
    if (filter === "published") return enabled;
    if (filter === "draft") return !enabled;
    return false;
  }
  return item.status === filter;
}

export function getNewItemLabel(collection: string): string {
  switch (collection) {
    case "academy_programs":
      return "Nuevo programa";
    case "content_news":
      return "Nueva noticia";
    case "content_events":
      return "Nuevo evento";
    case "content_library":
      return "Nuevo recurso";
    case "academy_testimonials":
      return "Nuevo testimonio";
    case "academy_gallery":
      return "Nueva imagen";
    case "academy_categories":
      return "Nueva categoría";
    default:
      return "Nuevo";
  }
}
