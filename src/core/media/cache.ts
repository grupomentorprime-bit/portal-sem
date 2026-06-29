import type { CmsMediaAsset } from "@/types/media";

const DEFAULT_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const mediaCache = new Map<string, CacheEntry<CmsMediaAsset | null>>();

export function getCachedMedia(key: string): CmsMediaAsset | null | undefined {
  const entry = mediaCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    mediaCache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCachedMedia(
  key: string,
  value: CmsMediaAsset | null,
  ttlMs = DEFAULT_TTL_MS
): void {
  mediaCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateMediaCache(mediaId?: string): void {
  if (!mediaId) {
    mediaCache.clear();
    return;
  }
  for (const key of mediaCache.keys()) {
    if (key.endsWith(`:${mediaId}`)) mediaCache.delete(key);
  }
}
