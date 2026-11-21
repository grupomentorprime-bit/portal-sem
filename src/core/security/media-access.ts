import path from "path";

/**
 * Puerta de lectura. Un archivo es público solo con clasificación explícita
 * (`distribution: "public"` o carpeta de exhibición del portal). El resto
 * exige empresa, usuario y recurso. Ocultar la URL no alcanza: el disco del
 * CMS no vive bajo `public/` y un bucket de lectura anónima rechaza la subida
 * privada.
 */
export const MEDIA_LINK_REVIEW = {
  reviewedOn: "2026-11-19",
  baseCommit: "547f99c",
  appDoors: ["/api/cms/media/stream", "/media/[...path]"],
  directStorage:
    "Un archivo privado no recibe URL de bucket ni de CDN. Si accessMode no es private y hay publicUrl, la subida privada se rechaza.",
  localDev: "El disco del CMS queda en data/media, fuera de public/media.",
  institutionalStatic:
    "public/documentos y el catálogo institucional de public/media siguen públicos. No son objetos del CMS.",
  unchanged: "No se llama a la API del bucket ni se reescriben los estáticos institucionales.",
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
  return containedStoragePath(root, key);
}

/** Prefijo de un asset (`tenant/media-id`), sin exigir el nombre del archivo. */
export function resolveContainedMediaPrefix(root: string, prefix: string): string | null {
  if (!prefix || prefix.length > 512) return null;
  if (prefix.includes("\\") || prefix.includes("\0") || prefix.includes("%")) return null;
  const parts = prefix.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return null;
  if (!/^[a-z0-9-]+\/media-[a-z0-9-]+$/i.test(prefix)) return null;
  return containedStoragePath(root, prefix);
}

function containedStoragePath(root: string, relative: string): string | null {
  const base = path.resolve(root);
  const filePath = path.resolve(base, relative);
  if (filePath !== base && !filePath.startsWith(base + path.sep)) return null;
  return filePath;
}

/** Disco de objetos del CMS. Nunca el directorio estático de Next. */
export function mediaDiskRoot(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): string {
  const configured = env.MEDIA_LOCAL_ROOT?.trim();
  if (configured) return configured;
  return path.join(cwd, "data", "media");
}

export function mediaDiskIsPublicWebRoot(root: string, cwd = process.cwd()): boolean {
  const publicMedia = path.resolve(cwd, "public", "media");
  const resolved = path.resolve(root);
  return resolved === publicMedia || resolved.startsWith(publicMedia + path.sep);
}

export function keyFromPublicObjectUrl(url: string): string | null {
  try {
    const parsed = url.startsWith("http")
      ? new URL(url)
      : new URL(url, "https://placeholder.local");
    const marker = "/media/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx < 0) return null;
    const key = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    return isSafeMediaStorageKey(key) ? key : null;
  } catch {
    return null;
  }
}

/** Un documento privado no se entrega con la URL del bucket ni con `/media/…`. */
export function presentMediaUrl(input: { distribution: MediaDistribution; url: string }): string {
  if (input.distribution !== "private") return input.url;
  const key = keyFromPublicObjectUrl(input.url);
  if (!key) return input.url;
  return `/api/cms/media/stream?key=${encodeURIComponent(key)}`;
}

/**
 * URL que ve el navegador. El CDN solo entra si el archivo es público y el
 * almacenamiento está clasificado como público. Un privado siempre vuelve al proxy.
 */
export function authorizedDeliveryUrl(input: {
  distribution: MediaDistribution;
  key: string;
  publicBase?: string | null;
  accessMode?: string | null;
}): string {
  const base = input.publicBase?.replace(/\/$/, "") ?? "";
  if (input.distribution === "public" && input.accessMode === "public" && base) {
    return `${base}/media/${input.key}`;
  }
  return `/api/cms/media/stream?key=${encodeURIComponent(input.key)}`;
}

/** True cuando guardar ese privado lo dejaría legible sin credenciales. */
export function anonymousReadWouldExposePrivate(
  settings: {
    mode: string;
    accessMode?: string | null;
    publicUrl?: string | null;
  },
  distribution: MediaDistribution
): boolean {
  if (distribution === "public") return false;
  return settings.mode === "s3" && settings.accessMode !== "private" && Boolean(settings.publicUrl);
}

export function directStorageBypassesApp(settings: {
  mode: string;
  accessMode?: string | null;
  publicUrl?: string | null;
}): boolean {
  return anonymousReadWouldExposePrivate(settings, "private");
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
  memberUserId: string | null;
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
  if (!input.memberUserId || !input.memberTenantId || input.memberTenantId !== asset.tenant) {
    return { allow: false, status: 404 };
  }
  return { allow: true, distribution, cacheControl: "private, no-store" };
}
