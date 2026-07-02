import type { BlockType, PageBlock } from "@/types/page";
import type { BlockContentQuery } from "@/types/content";

export const QUERY_BLOCK_TYPES: BlockType[] = [
  "programs",
  "academic_offer",
  "teachers",
  "people",
  "news",
  "events",
  "academic_agenda",
  "institutional_notices",
  "library",
  "testimonials",
  "gallery",
];

export const DEFAULT_BLOCK_QUERIES: Record<string, BlockContentQuery> = {
  programs: {
    collection: "academy_programs",
    featured: true,
    limit: 3,
    sort: { field: "order", direction: "asc" },
  },
  academic_offer: {
    collection: "academy_programs",
    featured: true,
    limit: 3,
    sort: { field: "order", direction: "asc" },
  },
  teachers: {
    collection: "content_people",
    limit: 4,
    sort: { field: "order", direction: "asc" },
  },
  people: {
    collection: "content_people",
    limit: 4,
    category: "team_leadership",
    sort: { field: "order", direction: "asc" },
  },
  news: {
    collection: "content_news",
    limit: 3,
    sort: { field: "publishedAt", direction: "desc" },
  },
  events: {
    collection: "content_events",
    limit: 4,
    sort: { field: "publishedAt", direction: "asc" },
  },
  academic_agenda: {
    collection: "content_academic_agenda",
    limit: 4,
    upcoming: true,
    sort: { field: "startDate", direction: "asc" },
  },
  institutional_notices: {
    collection: "content_institutional_notices",
    limit: 4,
    sort: { field: "priority", direction: "desc" },
  },
  library: {
    collection: "content_library",
    limit: 4,
    sort: { field: "title", direction: "asc" },
  },
  testimonials: {
    collection: "academy_testimonials",
    limit: 3,
    sort: { field: "order", direction: "asc" },
  },
  gallery: {
    collection: "academy_gallery",
    limit: 4,
    sort: { field: "order", direction: "asc" },
  },
};

export function blockTypeToDefaultQuery(type: BlockType): BlockContentQuery | null {
  return DEFAULT_BLOCK_QUERIES[type] ?? null;
}

export function getBlockQuery(block: PageBlock): BlockContentQuery | null {
  const raw = block.settings.query;
  if (raw && typeof raw === "object" && "collection" in raw) {
    return raw as BlockContentQuery;
  }
  return blockTypeToDefaultQuery(block.type);
}
