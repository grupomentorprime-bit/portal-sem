import sharp from "sharp";
import {
  RESPONSIVE_WIDTHS,
  THUMBNAIL_WIDTH,
} from "@/lib/cms/media-defaults";
import { putMediaFile, buildStorageKey } from "@/lib/cms/media-storage";
import type { MediaResponsiveUrls } from "@/types/media";

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
}

export interface ProcessedImageResult {
  metadata: ImageMetadata;
  responsive: MediaResponsiveUrls;
  thumbnail: string;
  primaryUrl: string;
  webpUrl?: string;
}

function sanitizeSvg(buffer: Buffer): Buffer {
  const text = buffer.toString("utf8");
  const cleaned = text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
  return Buffer.from(cleaned, "utf8");
}

export async function extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width, height: meta.height, format: meta.format };
  } catch {
    return {};
  }
}

export async function processUploadedImage(
  buffer: Buffer,
  mimeType: string,
  tenant: string,
  mediaId: string,
  baseName: string
): Promise<ProcessedImageResult> {
  if (mimeType === "image/svg+xml") {
    const safe = sanitizeSvg(buffer);
    const key = buildStorageKey(tenant, mediaId, `${baseName}.svg`);
    const stored = await putMediaFile(key, safe, mimeType);
    return {
      metadata: {},
      responsive: {},
      thumbnail: stored.publicUrl,
      primaryUrl: stored.publicUrl,
    };
  }

  const image = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const meta: ImageMetadata = {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };

  const responsive: MediaResponsiveUrls = {};
  const originalKey = buildStorageKey(tenant, mediaId, `${baseName}.webp`);
  const originalWebp = await image.clone().webp({ quality: 85 }).toBuffer();
  const originalStored = await putMediaFile(originalKey, originalWebp, "image/webp");
  responsive.webp = originalStored.publicUrl;

  const thumbKey = buildStorageKey(tenant, mediaId, `${baseName}-thumb.webp`);
  const thumbBuf = await image
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbStored = await putMediaFile(thumbKey, thumbBuf, "image/webp");
  responsive.thumbnail = thumbStored.publicUrl;

  for (const width of RESPONSIVE_WIDTHS) {
    const variantKey = buildStorageKey(tenant, mediaId, `${baseName}-w${width}.webp`);
    const variantBuf = await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const stored = await putMediaFile(variantKey, variantBuf, "image/webp");
    const urlKey = `w${width}` as keyof MediaResponsiveUrls;
    responsive[urlKey] = stored.publicUrl;
  }

  return {
    metadata: meta,
    responsive,
    thumbnail: responsive.thumbnail ?? originalStored.publicUrl,
    primaryUrl: originalStored.publicUrl,
    webpUrl: originalStored.publicUrl,
  };
}

export async function computeFileHash(buffer: Buffer): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(buffer).digest("hex");
}
