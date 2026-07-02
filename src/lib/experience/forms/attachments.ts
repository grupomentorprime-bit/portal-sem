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
  const mimeType = inferAttachmentMimeType(file);
  if (!mimeType || !isAllowedAttachmentMimeType(mimeType)) {
    return "Formato no permitido. Usa PDF o imagen (JPG, PNG, WEBP).";
  }
  return null;
}

export function inferAttachmentMimeType(file: Pick<File, "name" | "type">): string {
  const declared = String(file.type ?? "").trim();
  if (declared) return declared;

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return byExtension[extension] ?? "";
}

export function isAllowedAttachmentMimeType(mimeType: string): boolean {
  return FORM_ATTACHMENT_MIME_TYPES.includes(mimeType as (typeof FORM_ATTACHMENT_MIME_TYPES)[number]);
}

export function hasPendingAttachmentFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

export function hasJustificationAttachment(data: Record<string, unknown>): boolean {
  return hasSubmissionAttachment(data.justificationAttachment) || hasPendingAttachmentFile(data.justificationAttachmentFile);
}

export function getUploadedJustificationAttachment(
  data: Record<string, unknown>
): FormSubmissionAttachment | null {
  return parseSubmissionAttachment(data.justificationAttachment);
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
