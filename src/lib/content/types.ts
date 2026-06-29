import type { ContentQuery, ContentResult } from "@/types/content";

export const ALLOWED_COLLECTIONS = [
  "academy_programs",
  "academy_categories",
  "academy_teachers",
  "academy_team",
  "academy_testimonials",
  "academy_gallery",
  "content_news",
  "content_news_categories",
  "content_events",
  "content_library",
] as const;

export type AllowedCollection = (typeof ALLOWED_COLLECTIONS)[number];

export const ALLOWED_FILTER_KEYS = [
  "featured",
  "published",
  "category",
  "categoryId",
  "tags",
  "status",
  "slug",
  "search",
  "dateFrom",
  "dateTo",
] as const;

export const ALLOWED_SORT_FIELDS = [
  "order",
  "title",
  "name",
  "publishedAt",
  "createdAt",
  "updatedAt",
  "date",
] as const;

export const MAX_QUERY_LIMIT = 50;
export const DEFAULT_QUERY_LIMIT = 10;

export type { ContentQuery, ContentResult };

export interface ContentQueryRequest {
  tenant: string;
  collection: string;
  filters?: Record<string, unknown>;
  sort?: { field: string; direction: string };
  pagination?: { page?: number; limit?: number };
  preview?: boolean;
  mapItems?: boolean;
}
