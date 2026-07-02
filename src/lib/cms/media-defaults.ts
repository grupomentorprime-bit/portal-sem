import type { MediaCategory, MediaFolder } from "@/types/media";

export const MEDIA_SIZE_LIMITS: Record<string, number> = {
  image: 15 * 1024 * 1024,
  document: 50 * 1024 * 1024,
  video: 300 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  default: 50 * 1024 * 1024,
};

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export const MIME_TO_CATEGORY: Record<string, MediaCategory> = {
  "image/png": "Imagen",
  "image/jpeg": "Imagen",
  "image/jpg": "Imagen",
  "image/webp": "Imagen",
  "image/svg+xml": "SVG",
  "application/pdf": "Documento",
  "video/mp4": "Video",
  "audio/mpeg": "Audio",
  "audio/mp3": "Audio",
  "application/zip": "Documento",
  "application/x-zip-compressed": "Documento",
};

export const EXTENSION_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  zip: "application/zip",
};

export const TRASH_RETENTION_DAYS = 30;

export const RESPONSIVE_WIDTHS = [400, 800, 1200] as const;

/** Hero: 3 tamaños WebP (móvil, tablet, desktop) — sin duplicar JPEG */
export const HERO_WEBP_WIDTHS = [768, 1080, 1920] as const;

export const THUMBNAIL_WIDTH = 200;

export const DEFAULT_MEDIA_FOLDER: MediaFolder = "Otros";

export function inferCategory(mimeType: string): MediaCategory {
  return MIME_TO_CATEGORY[mimeType] ?? "Documento";
}

export function getSizeLimitForMime(mimeType: string): number {
  if (mimeType.startsWith("image/")) return MEDIA_SIZE_LIMITS.image;
  if (mimeType.startsWith("video/")) return MEDIA_SIZE_LIMITS.video;
  if (mimeType.startsWith("audio/")) return MEDIA_SIZE_LIMITS.audio;
  if (mimeType === "application/pdf" || mimeType.includes("zip")) {
    return MEDIA_SIZE_LIMITS.document;
  }
  return MEDIA_SIZE_LIMITS.default;
}
