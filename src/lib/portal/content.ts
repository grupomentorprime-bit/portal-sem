import "server-only";

import { executeContentQuery } from "@/lib/content/resolver";
import {
  mapToAcademicAgendaItem,
  mapToEventItem,
  mapToInstitutionalNoticeItem,
  mapToLibraryItem,
  mapToNewsItem,
  mapToProgramItem,
  mapToPersonItem,
} from "@/lib/content/mappers";
import type { PersonItem } from "@/types/people-grid";
import type {
  AcademicAgendaItem,
  ContentDocument,
  EventItem,
  InstitutionalNoticeItem,
  LibraryItem,
  NewsItem,
  ProgramItem,
} from "@/types/content";

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

export async function fetchTeam(tenant: string): Promise<PersonItem[]> {
  const peopleResult = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_people",
      filters: { status: "published" },
      sort: { field: "order", direction: "asc" },
      pagination: { limit: 48, page: 1 },
    },
    { mapItems: false }
  );

  if (peopleResult.items.length > 0) {
    return peopleResult.items.map(mapToPersonItem);
  }

  const legacyResult = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "academy_team",
      filters: { status: "published" },
      sort: { field: "order", direction: "asc" },
      pagination: { limit: 48, page: 1 },
    },
    { mapItems: false }
  );
  return legacyResult.items.map(mapToPersonItem);
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

export async function fetchAcademicAgenda(
  tenant: string,
  options?: { limit?: number; upcoming?: boolean }
): Promise<AcademicAgendaItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_academic_agenda",
      filters: {
        status: "published",
        ...(options?.upcoming !== false ? { upcoming: true } : {}),
      },
      sort: { field: "startDate", direction: "asc" },
      pagination: { limit: options?.limit ?? 24, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToAcademicAgendaItem);
}

export async function fetchAcademicAgendaBySlug(
  tenant: string,
  slug: string
): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_academic_agenda",
      filters: { status: "published", slug },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

export async function fetchInstitutionalNotices(
  tenant: string,
  options?: { limit?: number; featured?: boolean }
): Promise<InstitutionalNoticeItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_institutional_notices",
      filters: {
        status: "published",
        ...(options?.featured ? { featured: true } : {}),
      },
      sort: { field: "priority", direction: "desc" },
      pagination: { limit: options?.limit ?? 24, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToInstitutionalNoticeItem);
}

export async function fetchInstitutionalNoticeBySlug(
  tenant: string,
  slug: string
): Promise<ContentDocument | null> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_institutional_notices",
      filters: { status: "published", slug },
      pagination: { limit: 1, page: 1 },
    },
    { mapItems: false, skipCache: true }
  );
  return result.items[0] ?? null;
}

export async function fetchLibrary(
  tenant: string,
  options?: { limit?: number; resourceType?: string }
): Promise<LibraryItem[]> {
  const result = await executeContentQuery<ContentDocument>(
    {
      tenant,
      collection: "content_library",
      filters: {
        status: "published",
        ...(options?.resourceType ? { resourceType: options.resourceType } : {}),
      },
      sort: { field: "title", direction: "asc" },
      pagination: { limit: options?.limit ?? 48, page: 1 },
    },
    { mapItems: false }
  );
  return result.items.map(mapToLibraryItem);
}
