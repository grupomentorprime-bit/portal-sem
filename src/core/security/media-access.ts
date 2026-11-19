import path from "path";

/**
 * Revisión de enlaces, hecha en código antes de cambiar la puerta de la app.
 * El objeto en un bucket con URL pública sigue fuera de esta ruta: no se toca
 * la política del bucket ni Dokploy.
 */
export const MEDIA_LINK_REVIEW = {
  reviewedOn: "2026-11-19",
  baseCommit: "5388492",
  appDoors: ["/api/cms/media/stream", "/media/[...path]"],
  directStorage:
    "Con S3 en accessMode public, buildPublicUrl publica {publicUrl}/media/{key}. Ese enlace no pasa por la app.",
  localDev:
    "En desarrollo el disco puede quedar bajo public/media y Next lo sirve como estático.",
  institutionalStatic:
    "public/documentos y public/media institucionales no son el stream del CMS.",
  unchanged: "No se modifica el bucket, el accessMode ni los archivos estáticos.",
} as const;

export type MediaDistribution = "public" | "private";

/** Propósito del archivo. No es el tipo ni la extensión. */
export type MediaPurpose = "portal-display" | "restricted-record";

const PORTAL_DISPLAY_FOLDERS = new Set([
  "Logos",
  "Hero",
  "Galería",
  "Landing",
  "Iconos",
  "Testimonios",
  "Noticias",
  "Profesores",
  "Eventos",
  "Videos",
  "Audio",
]);

const RESTRICTED_FOLDERS = new Set([
  "Documentos",
  "Descargas",
  "Biblioteca",
  "Programas",
  "Otros",
]);

export function purposeFromFolder(folder: string): MediaPurpose {
  if (PORTAL_DISPLAY_FOLDERS.has(folder)) return "portal-display";
  if (RESTRICTED_FOLDERS.has(folder)) return "restricted-record";
  return "restricted-record";
}

export function distributionFromPurpose(purpose: MediaPurpose): MediaDistribution {
  return purpose === "portal-display" ? "public" : "private";
}

export function resolveMediaDistribution(asset: {
  distribution?: MediaDistribution | null;
  folder?: string | null;
}): MediaDistribution {
  if (asset.distribution === "public" || asset.distribution === "private") {
    return asset.distribution;
  }
  return distributionFromPurpose(purposeFromFolder(asset.folder ?? ""));
}

export function storageTenantSegment(tenant: string): string {
  return tenant.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

export function isSafeMediaStorageKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("\\") || key.includes("\0") || key.includes("%")) return false;
  const parts = key.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return false;
  return /^[a-z0-9-]+\/media-[a-z0-9-]+\/.+$/i.test(key);
}

export function resolveContainedMediaPath(root: string, key: string): string | null {
  if (!isSafeMediaStorageKey(key)) return null;
  const base = path.resolve(root);
  const filePath = path.resolve(base, key);
  if (filePath !== base && !filePath.startsWith(base + path.sep)) return null;
  return filePath;
}

export function directStorageBypassesApp(settings: {
  mode: string;
  accessMode?: string | null;
  publicUrl?: string | null;
}): boolean {
  return settings.mode === "s3" && settings.accessMode !== "private" && Boolean(settings.publicUrl);
}

export interface MediaReadAsset {
  tenant: string;
  folder?: string | null;
  distribution?: MediaDistribution | null;
  visibility?: string | null;
  status?: string | null;
  storageKey: string;
}

export function decideMediaRead(input: {
  key: string;
  operationalTenantId: string;
  asset: MediaReadAsset | null;
  memberTenantId: string | null;
}):
  | { allow: true; distribution: MediaDistribution; cacheControl: string }
  | { allow: false; status: 404 } {
  if (!isSafeMediaStorageKey(input.key)) return { allow: false, status: 404 };
  const segment = storageTenantSegment(input.operationalTenantId);
  if (!input.key.startsWith(`${segment}/`)) return { allow: false, status: 404 };
  const asset = input.asset;
  if (!asset || asset.tenant !== input.operationalTenantId) return { allow: false, status: 404 };
  if (asset.visibility === "trash" || asset.status === "archived") {
    return { allow: false, status: 404 };
  }
  const prefix = asset.storageKey.endsWith("/") ? asset.storageKey : `${asset.storageKey}/`;
  if (!input.key.startsWith(prefix)) return { allow: false, status: 404 };
  const distribution = resolveMediaDistribution(asset);
  if (distribution === "public") {
    return { allow: true, distribution, cacheControl: "public, max-age=3600" };
  }
  if (!input.memberTenantId || input.memberTenantId !== asset.tenant) {
    return { allow: false, status: 404 };
  }
  return { allow: true, distribution, cacheControl: "private, no-store" };
}
