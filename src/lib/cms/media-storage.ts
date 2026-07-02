import { unlink, rm, readFile } from "fs/promises";
import path from "path";
import { deleteS3Object, getS3ObjectBuffer, putS3Object } from "@/lib/cms/storage-s3";
import { assertS3StorageForUpload, resolveStorageSettings } from "@/lib/cms/storage-config";
import {
  buildMediaProxyUrl,
  isValidMediaStorageKey,
  MEDIA_STREAM_PATH,
  usesPrivateMediaProxy,
} from "@/lib/cms/storage-normalize";
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

function stripMediaVersionQuery(url: string): string {
  return url.replace(/([?&])v=\d+(?:&|$)/, "$1").replace(/[?&]$/, "");
}

/** Extrae la clave de almacenamiento (tenant/media-…/archivo) desde una URL pública o del proxy. */
export function storageKeyFromMediaUrl(url: string): string | null {
  const trimmed = stripMediaVersionQuery(url.trim());
  if (!trimmed) return null;

  try {
    const parsed = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://placeholder.local");
    if (parsed.pathname === MEDIA_STREAM_PATH || parsed.pathname.endsWith(MEDIA_STREAM_PATH)) {
      const key = parsed.searchParams.get("key")?.trim();
      return key && isValidMediaStorageKey(key) ? key : null;
    }
    const pathOnly = `${parsed.pathname}${parsed.search}`;
    if (pathOnly.startsWith("/media/")) {
      const key = pathOnly.replace(/^\/media\//, "").replace(/\?.*$/, "");
      return isValidMediaStorageKey(key) ? key : null;
    }
  } catch {
    return null;
  }

  return null;
}

/** Reconstruye la URL pública actual de un archivo según la configuración de almacenamiento activa. */
export async function resolveMediaStoragePublicUrl(storageKey: string): Promise<string> {
  const settings = await resolveStorageSettings();
  return buildPublicUrl(settings, storageKey);
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
