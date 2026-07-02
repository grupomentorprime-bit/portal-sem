import "server-only";

import { PLATFORM_ASSET_FALLBACKS } from "@/lib/cms/asset-paths";
import { findMediaById, findMediaByUrl } from "./lookup";
import {
  assetToResolved,
  type MediaReference,
  type MediaVariant,
  type ResolvedMedia,
} from "./types";

function firstNonEmptyUrl(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function pickVariantUrl(
  resolved: ResolvedMedia,
  variant: MediaVariant = "w1200"
): string {
  const { responsive, url, thumbnail } = resolved;
  let picked: string;
  switch (variant) {
    case "thumbnail":
      picked = firstNonEmptyUrl(thumbnail, responsive.thumbnail, url);
      break;
    case "w400":
      picked = firstNonEmptyUrl(responsive.w400, responsive.webp, url);
      break;
    case "w800":
      picked = firstNonEmptyUrl(responsive.w800, responsive.webp, url);
      break;
    case "w1200":
      picked = firstNonEmptyUrl(responsive.w1200, responsive.webp, url);
      break;
    case "w1920":
      picked = firstNonEmptyUrl(responsive.w1920, responsive.webp, url);
      break;
    case "w1440":
      picked = firstNonEmptyUrl(responsive.w1440, responsive.w1920, responsive.webp, url);
      break;
    case "w1600":
      picked = firstNonEmptyUrl(responsive.w1600, responsive.w1920, responsive.webp, url);
      break;
    case "w1080":
      picked = firstNonEmptyUrl(responsive.w1080, responsive.w1200, responsive.webp, url);
      break;
    case "w768":
      picked = firstNonEmptyUrl(responsive.w768, responsive.w800, responsive.webp, url);
      break;
    case "webp":
      picked = firstNonEmptyUrl(responsive.webp, url);
      break;
    case "original":
    default:
      picked = firstNonEmptyUrl(url);
  }
  return appendMediaVersion(picked, resolved.version);
}

function appendMediaVersion(url: string, version: number): string {
  if (!url?.trim() || version <= 1) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
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
  if (!resolved) return null;
  const url = pickVariantUrl(resolved, variant).trim();
  return url || null;
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
