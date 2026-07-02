export const FORM_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export const FORM_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export interface FormSubmissionAttachment {
  mediaId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export function validateFormAttachmentFile(file: File): string | null {
  if (!file || file.size === 0) {
    return "Debe adjuntar un justificativo.";
  }
  if (file.size > FORM_ATTACHMENT_MAX_BYTES) {
    return "El archivo no puede superar 5 MB.";
  }
  if (!FORM_ATTACHMENT_MIME_TYPES.includes(file.type as (typeof FORM_ATTACHMENT_MIME_TYPES)[number])) {
    return "Formato no permitido. Usa PDF o imagen (JPG, PNG, WEBP).";
  }
  return null;
}

export function parseSubmissionAttachment(value: unknown): FormSubmissionAttachment | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const mediaId = String(record.mediaId ?? "").trim();
  const url = String(record.url ?? "").trim();
  const filename = String(record.filename ?? "").trim();
  if (!mediaId || !url || !filename) return null;
  return {
    mediaId,
    url,
    filename,
    mimeType: String(record.mimeType ?? ""),
    size: Number(record.size ?? 0),
  };
}

export function hasSubmissionAttachment(value: unknown): boolean {
  return parseSubmissionAttachment(value) !== null;
}

export function getSubmissionAttachment(
  data: Record<string, unknown>
): FormSubmissionAttachment | null {
  return parseSubmissionAttachment(data.justificationAttachment);
}
