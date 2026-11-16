import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  AVATAR_MAX_BYTES,
  AVATAR_MAX_EDGE,
  AVATAR_SIZE_HINT,
  avatarDimensionError,
  avatarFileError,
} from "./avatar-upload";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class AvatarUploadError extends Error {
  constructor(
    message: string,
    readonly width?: number,
    readonly height?: number
  ) {
    super(message);
    this.name = "AvatarUploadError";
  }
}

function avatarDir(): string {
  return path.join(process.cwd(), "data", "desktop-avatars");
}

function avatarPath(userId: string): string {
  const name = createHash("sha256").update(userId).digest("hex");
  return path.join(avatarDir(), `${name}.webp`);
}

export async function readAvatarPhoto(userId: string): Promise<Buffer | null> {
  try {
    return await readFile(avatarPath(userId));
  } catch {
    return null;
  }
}

export async function deleteAvatarPhoto(userId: string): Promise<void> {
  try {
    await unlink(avatarPath(userId));
  } catch {
    /* no había archivo */
  }
}

export async function storeAvatarPhoto(
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
  const fileError = avatarFileError({ type: declared, size: buffer.length });
  if (fileError) throw new AvatarUploadError(fileError);
  if (buffer.length > AVATAR_MAX_BYTES) {
    throw new AvatarUploadError(`La imagen pesa demasiado. ${AVATAR_SIZE_HINT}`);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { failOn: "none" }).rotate().metadata();
  } catch {
    throw new AvatarUploadError(`No se pudo leer la imagen. ${AVATAR_SIZE_HINT}`);
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new AvatarUploadError(
      `No se pudo leer las medidas de la imagen. ${AVATAR_SIZE_HINT}`
    );
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new AvatarUploadError(
      `Ese archivo no sirve como foto de avatar. ${AVATAR_SIZE_HINT}`,
      width,
      height
    );
  }

  const tooSmall = avatarDimensionError(width, height);
  if (tooSmall) throw new AvatarUploadError(tooSmall, width, height);

  const edge = Math.min(width, height, AVATAR_MAX_EDGE);
  const output = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: edge,
      height: edge,
      fit: "cover",
    })
    .webp({ quality: 82 })
    .toBuffer();

  const saved = await sharp(output).metadata();
  const savedWidth = saved.width ?? width;
  const savedHeight = saved.height ?? height;
  const updatedAt = new Date().toISOString();
  const target = avatarPath(userId);
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(avatarDir(), { recursive: true });
  await writeFile(temporary, output);
  try {
    try {
      await unlink(target);
    } catch {
      /* reemplazo del anterior */
    }
    await rename(temporary, target);
  } catch (err) {
    try {
      await unlink(temporary);
    } catch {
      /* temp ya movido o inexistente */
    }
    throw err;
  }

  return { width, height, savedWidth, savedHeight, updatedAt };
}
