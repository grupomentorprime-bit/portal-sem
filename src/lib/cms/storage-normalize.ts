import type { ResolvedStorageSettings, StorageAccessMode } from "@/types/integrations";

type S3Fields = NonNullable<ResolvedStorageSettings["s3"]>;

export const MEDIA_STREAM_PATH = "/api/cms/media/stream" as const;

/** Valida claves de almacenamiento generadas por buildStorageKey */
export function isValidMediaStorageKey(key: string): boolean {
  return /^[a-z0-9-]+\/media-[a-z0-9-]+\/.+$/i.test(key);
}

export function buildMediaProxyUrl(storageKey: string): string {
  return `${MEDIA_STREAM_PATH}?key=${encodeURIComponent(storageKey)}`;
}

/** Asegura protocolo https:// — el SDK de AWS lanza "Invalid URL" sin él. */
export function normalizeS3Endpoint(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `https://${trimmed.replace(/\/$/, "")}`;
}

/** Infiere región B2 desde el endpoint cuando el usuario deja "auto". */
export function inferS3Region(endpoint: string, region: string): string {
  const normalized = region.trim();
  if (normalized && normalized !== "auto") return normalized;

  const b2Match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  if (b2Match) return b2Match[1];

  return normalized || "auto";
}

export function normalizePublicUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function normalizeS3Fields(s3: S3Fields): S3Fields {
  const endpoint = normalizeS3Endpoint(s3.endpoint);
  const accessMode: StorageAccessMode = s3.accessMode ?? (s3.publicUrl ? "public" : "private");
  return {
    ...s3,
    endpoint,
    region: inferS3Region(endpoint, s3.region),
    bucket: s3.bucket.trim(),
    accessKeyId: s3.accessKeyId.trim(),
    publicUrl: normalizePublicUrl(s3.publicUrl),
    accessMode,
  };
}

export function usesPrivateMediaProxy(settings: ResolvedStorageSettings): boolean {
  return settings.mode === "s3" && settings.s3?.accessMode === "private";
}

export function formatStorageError(error: unknown): string {
  const err = error as {
    name?: string;
    message?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };

  const code = err.Code ?? err.name ?? "";
  const message = err.message ?? String(error);
  const status = err.$metadata?.httpStatusCode;

  if (/invalid url/i.test(message)) {
    return 'Endpoint inválido. Usa el formato completo, por ejemplo: https://s3.us-east-005.backblazeb2.com';
  }
  if (/unsupported header.*checksum/i.test(message)) {
    return "El proveedor S3 no soporta checksums del SDK. Actualiza el servidor o contacta soporte.";
  }
  if (/credentials|signature|access denied|forbidden|403|401/i.test(message) || status === 403 || status === 401) {
    return "Credenciales incorrectas o sin permisos de lectura/escritura sobre el bucket. Verifica la Application Key en Backblaze.";
  }
  if (/nosuchbucket|not found|404/i.test(message) || status === 404) {
    return "Bucket no encontrado. Verifica el nombre exacto del bucket en Backblaze.";
  }
  if (code === "UnknownError" || /unknownerror/i.test(message)) {
    if (status === 400) {
      return "Error de configuración (400). Verifica endpoint, región, Path-style activado y que la Application Key tenga acceso al bucket.";
    }
    return `Error S3${status ? ` HTTP ${status}` : ""}. Revisa endpoint, región y permisos de la Application Key.`;
  }

  return message || "No se pudo conectar con el bucket.";
}
