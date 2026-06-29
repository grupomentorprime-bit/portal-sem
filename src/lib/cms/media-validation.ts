import {
  ALLOWED_MIME_TYPES,
  EXTENSION_TO_MIME,
  getSizeLimitForMime,
} from "@/lib/cms/media-defaults";
import {
  MEDIA_CATEGORIES,
  MEDIA_FOLDERS,
  MEDIA_VISIBILITY,
  type CmsMediaUpdate,
  type MediaBulkAction,
  type MediaListQuery,
  type MediaSearchQuery,
} from "@/types/media";

export interface MediaValidationError {
  field: string;
  message: string;
}

export function validateMediaUpload(input: {
  tenant?: string;
  mimeType?: string;
  extension?: string;
  size?: number;
  folder?: string;
}): MediaValidationError[] {
  const errors: MediaValidationError[] = [];

  if (!input.tenant?.trim()) {
    errors.push({ field: "tenant", message: "El tenant es obligatorio." });
  }

  const mime =
    input.mimeType ??
    (input.extension ? EXTENSION_TO_MIME[input.extension.toLowerCase()] : undefined);

  if (!mime) {
    errors.push({ field: "mimeType", message: "Tipo MIME no reconocido." });
  } else if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mime)) {
    errors.push({ field: "mimeType", message: `Tipo "${mime}" no permitido.` });
  }

  if (typeof input.size !== "number" || input.size <= 0) {
    errors.push({ field: "size", message: "Tamaño de archivo inválido." });
  } else if (mime) {
    const limit = getSizeLimitForMime(mime);
    if (input.size > limit) {
      errors.push({
        field: "size",
        message: `Archivo excede el límite (${Math.round(limit / 1024 / 1024)} MB).`,
      });
    }
  }

  if (input.folder && !(MEDIA_FOLDERS as readonly string[]).includes(input.folder)) {
    errors.push({ field: "folder", message: "Carpeta no válida." });
  }

  return errors;
}

export function validateMediaUpdate(data: CmsMediaUpdate): MediaValidationError[] {
  const errors: MediaValidationError[] = [];

  if (data.folder && !(MEDIA_FOLDERS as readonly string[]).includes(data.folder)) {
    errors.push({ field: "folder", message: "Carpeta no válida." });
  }
  if (data.category && !(MEDIA_CATEGORIES as readonly string[]).includes(data.category)) {
    errors.push({ field: "category", message: "Categoría no válida." });
  }
  if (data.visibility && !(MEDIA_VISIBILITY as readonly string[]).includes(data.visibility)) {
    errors.push({ field: "visibility", message: "Visibilidad no válida." });
  }

  return errors;
}

export function validateMediaListQuery(query: MediaListQuery): MediaValidationError[] {
  const errors: MediaValidationError[] = [];
  if (!query.tenant?.trim()) {
    errors.push({ field: "tenant", message: "El tenant es obligatorio." });
  }
  const limit = query.limit ?? 24;
  if (limit < 1 || limit > 100) {
    errors.push({ field: "limit", message: "Límite entre 1 y 100." });
  }
  return errors;
}

export function validateBulkAction(body: MediaBulkAction): MediaValidationError[] {
  const errors: MediaValidationError[] = [];
  if (!body.tenant?.trim()) errors.push({ field: "tenant", message: "Tenant obligatorio." });
  if (!body.ids?.length) errors.push({ field: "ids", message: "Se requiere al menos un id." });
  if (!["trash", "restore", "delete", "move", "tag"].includes(body.action)) {
    errors.push({ field: "action", message: "Acción no válida." });
  }
  if (body.action === "move" && body.folder && !(MEDIA_FOLDERS as readonly string[]).includes(body.folder)) {
    errors.push({ field: "folder", message: "Carpeta no válida." });
  }
  return errors;
}

export function validateMediaSearch(query: MediaSearchQuery): MediaValidationError[] {
  return validateMediaListQuery(query);
}
