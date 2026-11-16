import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  WALLPAPER_MAX_BYTES,
  WALLPAPER_MAX_EDGE,
  WALLPAPER_SIZE_HINT,
  wallpaperDimensionError,
  wallpaperFileError,
} from "@/lib/desktop/wallpaper-upload";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class WallpaperUploadError extends Error {
  constructor(
    message: string,
    readonly width?: number,
    readonly height?: number
  ) {
    super(message);
    this.name = "WallpaperUploadError";
  }
}

function wallpaperDir(): string {
  return path.join(process.cwd(), "data", "desktop-wallpapers");
}

function wallpaperPath(userId: string): string {
  const name = createHash("sha256").update(userId).digest("hex");
  return path.join(wallpaperDir(), `${name}.webp`);
}

export async function readCustomWallpaper(userId: string): Promise<Buffer | null> {
  try {
    return await readFile(wallpaperPath(userId));
  } catch {
    return null;
  }
}

export async function deleteCustomWallpaper(userId: string): Promise<void> {
  try {
    await unlink(wallpaperPath(userId));
  } catch {
    /* no había archivo */
  }
}

export async function storeCustomWallpaper(
  userId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{
  width: number;
  height: number;
  savedWidth: number;
  savedHeight: number;
  updatedAt: string;
}> {
  const declared = mimeType === "application/octet-stream" ? "" : mimeType;
  const fileError = wallpaperFileError({ type: declared, size: buffer.length });
  if (fileError) throw new WallpaperUploadError(fileError);
  if (buffer.length > WALLPAPER_MAX_BYTES) {
    throw new WallpaperUploadError(`La imagen pesa demasiado. ${WALLPAPER_SIZE_HINT}`);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { failOn: "none" }).rotate().metadata();
  } catch {
    throw new WallpaperUploadError(
      `No se pudo leer la imagen. ${WALLPAPER_SIZE_HINT}`
    );
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new WallpaperUploadError(
      `No se pudo leer las medidas de la imagen. ${WALLPAPER_SIZE_HINT}`
    );
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new WallpaperUploadError(
      `Ese archivo no sirve como fondo. ${WALLPAPER_SIZE_HINT}`,
      width,
      height
    );
  }

  const tooSmall = wallpaperDimensionError(width, height);
  if (tooSmall) throw new WallpaperUploadError(tooSmall, width, height);

  const output = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: WALLPAPER_MAX_EDGE,
      height: WALLPAPER_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const saved = await sharp(output).metadata();
  const savedWidth = saved.width ?? width;
  const savedHeight = saved.height ?? height;
  const updatedAt = new Date().toISOString();
  const target = wallpaperPath(userId);
  const temporary = `${target}.tmp`;

  await mkdir(wallpaperDir(), { recursive: true });
  await writeFile(temporary, output);
  try {
    await unlink(target);
  } catch {
    /* reemplazo del anterior */
  }
  await rename(temporary, target);

  return { width, height, savedWidth, savedHeight, updatedAt };
}
