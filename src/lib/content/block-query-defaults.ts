import type { BlockType, PageBlock } from "@/types/page";
import type { BlockContentQuery } from "@/types/content";

export const QUERY_BLOCK_TYPES: BlockType[] = [
  "programs",
  "teachers",
  "news",
  "events",
  "library",
  "testimonials",
  "gallery",
];

export const DEFAULT_BLOCK_QUERIES: Record<string, BlockContentQuery> = {
  programs: {
    collection: "academy_programs",
    featured: true,
    limit: 6,
    sort: { field: "order", direction: "asc" },
  },
  teachers: {
    collection: "academy_team",
    limit: 4,
    sort: { field: "order", direction: "asc" },
  },
  news: {
    collection: "content_news",
    limit: 3,
    sort: { field: "publishedAt", direction: "desc" },
  },
  events: {
    collection: "content_events",
    limit: 2,
    sort: { field: "publishedAt", direction: "asc" },
  },
  library: {
    collection: "content_library",
    limit: 3,
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
