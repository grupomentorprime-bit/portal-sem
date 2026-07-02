import type { CmsMediaAsset, MediaResponsiveUrls } from "@/types/media";

export type MediaVariant =
  | "original"
  | "thumbnail"
  | "w400"
  | "w768"
  | "w800"
  | "w1080"
  | "w1200"
  | "w1440"
  | "w1600"
  | "w1920"
  | "webp";

export interface MediaFocalPoint {
  x: number;
  y: number;
}

export interface ResolvedMedia {
  mediaId: string;
  url: string;
  thumbnail: string;
  responsive: MediaResponsiveUrls;
  title: string;
  alt: string;
  caption: string;
  mime: string;
  width?: number;
  height?: number;
  dominantColor?: string;
  blurDataURL?: string;
  focalPoint?: MediaFocalPoint;
  version: number;
}

export interface MediaSelection {
  mediaId: string;
  url: string;
  thumbnail: string;
  title: string;
  alt: string;
  mime: string;
  width?: number;
  height?: number;
}

export interface MediaReference {
  mediaId?: string;
  legacyUrl?: string;
}

export function assetToResolved(asset: CmsMediaAsset): ResolvedMedia {
  return {
    mediaId: asset._id,
    url: asset.url,
    thumbnail: asset.thumbnail || asset.url,
    responsive: asset.responsive ?? {},
    title: asset.title ?? asset.originalName,
    alt: asset.alt,
    caption: asset.caption,
    mime: asset.mimeType,
    width: asset.width,
    height: asset.height,
    dominantColor: asset.dominantColor,
    blurDataURL: asset.blurDataURL,
    focalPoint: asset.focalPoint,
    version: asset.version ?? 1,
  };
}

export function assetToSelection(asset: CmsMediaAsset): MediaSelection {
  const url =
    asset.responsive?.w1200 ?? asset.responsive?.webp ?? asset.url;
  return {
    mediaId: asset._id,
    url,
    thumbnail: asset.thumbnail || asset.url,
    title: asset.title ?? asset.originalName,
    alt: asset.alt,
    mime: asset.mimeType,
    width: asset.width,
    height: asset.height,
  };
}

export function isMediaId(value: string): boolean {
  return Boolean(value?.startsWith("media-"));
}
