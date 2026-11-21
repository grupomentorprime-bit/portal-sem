import sharp from "sharp";
import {
  HERO_WEBP_WIDTHS,
  RESPONSIVE_WIDTHS,
  THUMBNAIL_WIDTH,
} from "@/lib/cms/media-defaults";
import { sanitizeSvgMarkup } from "@/lib/cms/sanitize";
import type { MediaDistribution } from "@/core/security/media-access";
import { putMediaFile, buildStorageKey } from "@/lib/cms/media-storage";
import type { MediaResponsiveUrls } from "@/types/media";

export type ImageVariantProfile = "default" | "hero";

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
  return Buffer.from(sanitizeSvgMarkup(buffer.toString("utf8")), "utf8");
}

export async function extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width, height: meta.height, format: meta.format };
  } catch {
    return {};
  }
}

async function generateWebpVariants(
  image: ReturnType<typeof sharp>,
  tenant: string,
  mediaId: string,
  baseName: string,
  widths: readonly number[],
  responsive: MediaResponsiveUrls,
  distribution: MediaDistribution
): Promise<void> {
  for (const width of widths) {
    const variantKey = buildStorageKey(tenant, mediaId, `${baseName}-w${width}.webp`);
    const variantBuf = await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const stored = await putMediaFile(variantKey, variantBuf, "image/webp", tenant, distribution);
    const urlKey = `w${width}` as keyof MediaResponsiveUrls;
    responsive[urlKey] = stored.publicUrl;
  }
}

export async function processUploadedImage(
  buffer: Buffer,
  mimeType: string,
  tenant: string,
  mediaId: string,
  baseName: string,
  variantProfile: ImageVariantProfile = "default",
  distribution: MediaDistribution = "private"
): Promise<ProcessedImageResult> {
  if (mimeType === "image/svg+xml") {
    const safe = sanitizeSvg(buffer);
    const key = buildStorageKey(tenant, mediaId, `${baseName}.svg`);
    const stored = await putMediaFile(key, safe, mimeType, tenant, distribution);
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
  const originalStored = await putMediaFile(originalKey, originalWebp, "image/webp", tenant, distribution);
  responsive.webp = originalStored.publicUrl;

  const thumbKey = buildStorageKey(tenant, mediaId, `${baseName}-thumb.webp`);
  const thumbBuf = await image
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const thumbStored = await putMediaFile(thumbKey, thumbBuf, "image/webp", tenant, distribution);
  responsive.thumbnail = thumbStored.publicUrl;

  if (variantProfile === "hero") {
    await generateWebpVariants(image, tenant, mediaId, baseName, HERO_WEBP_WIDTHS, responsive, distribution);
  } else {
    await generateWebpVariants(image, tenant, mediaId, baseName, RESPONSIVE_WIDTHS, responsive, distribution);
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
