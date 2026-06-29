import "server-only";

import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import { findMediaById, findMediaByUrl } from "./lookup";
import {
  assetToResolved,
  type MediaReference,
  type MediaVariant,
  type ResolvedMedia,
} from "./types";

function pickVariantUrl(
  resolved: ResolvedMedia,
  variant: MediaVariant = "w1200"
): string {
  const { responsive, url, thumbnail } = resolved;
  switch (variant) {
    case "thumbnail":
      return thumbnail || responsive.thumbnail || url;
    case "w400":
      return responsive.w400 ?? responsive.webp ?? url;
    case "w800":
      return responsive.w800 ?? responsive.webp ?? url;
    case "w1200":
      return responsive.w1200 ?? responsive.webp ?? url;
    case "w1920":
      return responsive.w1920 ?? responsive.webp ?? url;
    case "webp":
      return responsive.webp ?? url;
    case "original":
    default:
      return url;
  }
}

export async function resolveMedia(
  tenant: string,
  mediaId: string
): Promise<ResolvedMedia | null> {
  const asset = await findMediaById(tenant, mediaId);
  return asset ? assetToResolved(asset) : null;
}

export async function resolveMediaUrl(
  tenant: string,
  mediaId: string,
  variant: MediaVariant = "w1200"
): Promise<string | null> {
  const resolved = await resolveMedia(tenant, mediaId);
  return resolved ? pickVariantUrl(resolved, variant) : null;
}

export async function resolveMediaThumbnail(
  tenant: string,
  mediaId: string
): Promise<string | null> {
  return resolveMediaUrl(tenant, mediaId, "thumbnail");
}

export async function resolveMediaSet(
  tenant: string,
  mediaIds: string[],
  variant: MediaVariant = "w1200"
): Promise<ResolvedMedia[]> {
  const results = await Promise.all(
    mediaIds.map(async (id) => {
      const resolved = await resolveMedia(tenant, id);
      if (!resolved) return null;
      return { ...resolved, url: pickVariantUrl(resolved, variant) };
    })
  );
  return results.filter((r): r is ResolvedMedia => r !== null);
}

export async function resolveMediaPlaceholder(
  tenant: string,
  mediaId: string
): Promise<string | null> {
  const resolved = await resolveMedia(tenant, mediaId);
  return resolved?.blurDataURL ?? null;
}

export async function resolveMediaMetadata(
  tenant: string,
  mediaId: string
): Promise<ResolvedMedia | null> {
  return resolveMedia(tenant, mediaId);
}

export async function resolveMediaRef(
  tenant: string,
  ref: MediaReference,
  variant: MediaVariant = "w1200"
): Promise<string | null> {
  if (ref.mediaId) {
    const url = await resolveMediaUrl(tenant, ref.mediaId, variant);
    if (url) return url;
  }
  if (ref.legacyUrl?.trim()) {
    const asset = await findMediaByUrl(tenant, ref.legacyUrl);
    if (asset) return pickVariantUrl(assetToResolved(asset), variant);
    return ref.legacyUrl;
  }
  return null;
}

export async function resolveMediaRefWithFallback(
  tenant: string,
  ref: MediaReference,
  fallback: string,
  variant: MediaVariant = "w1200"
): Promise<string> {
  const url = await resolveMediaRef(tenant, ref, variant);
  return url || fallback;
}

export const MEDIA_PLACEHOLDER = PLATFORM_ASSET_FALLBACKS.hero;
