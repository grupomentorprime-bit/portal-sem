import "server-only";

import { executeContentQuery } from "@/lib/content/resolver";
import { mapToEventItem, mapToNewsItem, mapToProgramItem, mapToTeacherItem } from "@/lib/content/mappers";
import type { ContentDocument, EventItem, NewsItem, ProgramItem, TeacherItem } from "@/types/content";

export async function fetchPrograms(
  tenant: string,
  options?: { featured?: boolean; limit?: number }
): Promise<ProgramItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "academy_programs",
      filters: {
        status: "published",
        ...(options?.featured ? { featured: true } : {}),
      },
      sort: { field: "order", direction: "asc" },
      pagination: { limit: options?.limit ?? 24, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToProgramItem);
}

export async function fetchProgramBySlug(
  tenant: string,
  slug: string
): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "academy_programs",
      filters: { status: "published", slug },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

export async function fetchNews(
  tenant: string,
  options?: { limit?: number; category?: string }
): Promise<NewsItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_news",
      filters: {
        status: "published",
        ...(options?.category ? { category: options.category } : {}),
      },
      sort: { field: "publishedAt", direction: "desc" },
      pagination: { limit: options?.limit ?? 12, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToNewsItem);
}

export async function fetchNewsBySlug(
  tenant: string,
  slug: string
): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_news",
      filters: { status: "published", slug },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

export async function fetchEvents(
  tenant: string,
  options?: { limit?: number }
): Promise<EventItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_events",
      filters: { status: "published" },
      sort: { field: "publishedAt", direction: "asc" },
      pagination: { limit: options?.limit ?? 12, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToEventItem);
}

export async function fetchEventBySlug(
  tenant: string,
  slug: string
): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_events",
      filters: { status: "published", slug },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

export async function fetchTeam(tenant: string): Promise<TeacherItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "academy_team",
      filters: { status: "published" },
      sort: { field: "order", direction: "asc" },
      pagination: { limit: 48, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToTeacherItem);
}

export async function fetchRelatedNews(
  tenant: string,
  excludeSlug: string,
  category?: string,
  limit = 3
): Promise<NewsItem[]> {
  const items = await fetchNews(tenant, { limit: limit + 4, category });
  return items.filter((n) => n.href !== `/noticias/${excludeSlug}`).slice(0, limit);
}

export async function fetchRelatedEvents(
  tenant: string,
  excludeSlug: string,
  limit = 3
): Promise<EventItem[]> {
  const items = await fetchEvents(tenant, { limit: limit + 4 });
  return items.filter((e) => !e.href.endsWith(`/${excludeSlug}`)).slice(0, limit);
}
