import { unstable_cache, revalidateTag } from "next/cache";
import type { AllowedCollection } from "@/lib/content/types";

export const CONTENT_CACHE_TAG = "content-engine";

const COLLECTION_TTL: Partial<Record<AllowedCollection, number>> = {
  academy_programs: 120,
  content_news: 60,
  academy_team: 180,
  academy_teachers: 180,
  content_events: 90,
  content_library: 120,
  academy_testimonials: 180,
  academy_gallery: 180,
};

export function getCollectionTtl(collection: AllowedCollection): number {
  return COLLECTION_TTL[collection] ?? 60;
}

export function contentCacheTag(collection: string, tenant: string): string {
  return `content-${collection}-${tenant}`;
}

export function revalidateContentCache(collection: string, tenant?: string): void {
  revalidateTag(CONTENT_CACHE_TAG, "max");
  revalidateTag(`content-${collection}`, "max");
  if (tenant) revalidateTag(contentCacheTag(collection, tenant), "max");
}

export function cachedContentQuery<T>(
  key: string[],
  tags: string[],
  revalidate: number,
  fn: () => Promise<T>
): Promise<T> {
  return unstable_cache(fn, key, { tags, revalidate })();
}
