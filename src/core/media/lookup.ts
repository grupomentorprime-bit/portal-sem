import "server-only";

import { getDatabase } from "@/lib/mongodb";
import type { CmsMediaAsset } from "@/types/media";
import { getCachedMedia, setCachedMedia } from "./cache";

export async function findMediaByUrl(
  tenant: string,
  url: string
): Promise<CmsMediaAsset | null> {
  if (!url?.trim()) return null;

  const db = await getDatabase();
  return db.collection<CmsMediaAsset>("cms_media").findOne({
    tenant,
    $or: [
      { url },
      { thumbnail: url },
      { "responsive.thumbnail": url },
      { "responsive.webp": url },
      { "responsive.w400": url },
      { "responsive.w800": url },
      { "responsive.w1200": url },
      { "responsive.w1920": url },
    ],
    visibility: "active",
  });
}

export async function findMediaById(
  tenant: string,
  mediaId: string
): Promise<CmsMediaAsset | null> {
  if (!mediaId?.trim()) return null;

  const cacheKey = `${tenant}:${mediaId}`;
  const cached = getCachedMedia(cacheKey);
  if (cached !== undefined) return cached;

  const db = await getDatabase();
  const asset = await db.collection<CmsMediaAsset>("cms_media").findOne({
    _id: mediaId,
    tenant,
    visibility: "active",
  });

  setCachedMedia(cacheKey, asset);
  return asset;
}
