import { unlink, rm, readFile } from "fs/promises";
import path from "path";
import { deleteS3Object, getS3ObjectBuffer, putS3Object } from "@/lib/cms/storage-s3";
import { assertS3StorageForUpload, resolveStorageSettings } from "@/lib/cms/storage-config";
import { buildMediaProxyUrl, usesPrivateMediaProxy } from "@/lib/cms/storage-normalize";
import type { ResolvedStorageSettings } from "@/types/integrations";

export interface StoragePutResult {
  key: string;
  publicUrl: string;
}

function localMediaRoot(): string {
  const configured = process.env.MEDIA_LOCAL_ROOT?.trim();
  if (configured) return configured;

  // En Docker/producción public/ suele ser de solo lectura para el usuario de la app.
  if (process.env.NODE_ENV === "production") {
    return path.join(process.cwd(), "data", "media");
  }

  return path.join(process.cwd(), "public", "media");
}

function buildPublicUrl(settings: ResolvedStorageSettings, key: string): string {
  if (settings.mode === "s3" && settings.s3) {
    if (usesPrivateMediaProxy(settings)) {
      return buildMediaProxyUrl(key);
    }
    if (settings.s3.publicUrl) {
      return `${settings.s3.publicUrl}/media/${key}`;
    }
  }

  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, "")
    ?? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
    ?? process.env.APP_URL?.replace(/\/$/, "")
    ?? "";

  if (base && settings.mode === "s3") return `${base}/media/${key}`;
  return `/media/${key}`;
}

export async function readMediaFile(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const settings = await resolveStorageSettings();
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = guessMimeType(ext);

  if (settings.mode === "s3" && settings.s3) {
    const buffer = await getS3ObjectBuffer(settings.s3, key);
    return buffer ? { buffer, mimeType } : null;
  }

  try {
    const filePath = path.join(localMediaRoot(), key);
    const buffer = await readFile(filePath);
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

function guessMimeType(ext: string): string {
  const map: Record<string, string> = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function putMediaFile(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<StoragePutResult> {
  const s3 = await assertS3StorageForUpload();
  await putS3Object(s3, key, buffer, mimeType);

  const settings = await resolveStorageSettings();
  return { key, publicUrl: buildPublicUrl(settings, key) };
}

export async function deleteMediaFile(key: string): Promise<void> {
  const settings = await resolveStorageSettings();

  if (settings.mode === "s3" && settings.s3) {
    await deleteS3Object(settings.s3, key);
    return;
  }

  const filePath = path.join(localMediaRoot(), key);
  try {
    await unlink(filePath);
  } catch {
    /* file may not exist */
  }
}

export async function deleteMediaPrefix(prefix: string): Promise<void> {
  const settings = await resolveStorageSettings();
  if (settings.mode === "s3") {
    return;
  }
  const dirPath = path.join(localMediaRoot(), prefix);
  try {
    await rm(dirPath, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export function buildStorageKey(tenant: string, mediaId: string, filename: string): string {
  const safeTenant = tenant.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `${safeTenant}/${mediaId}/${filename}`;
}

export { testS3Connection } from "@/lib/cms/storage-s3";
