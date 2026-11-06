import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { findMediaById } from "@/core/media/lookup";
import { resolvePublicUrl } from "@/lib/app-url";
import {
  readMediaFile,
  resolveMediaStoragePublicUrl,
  storageKeyFromMediaUrl,
} from "@/lib/cms/media-storage";
import type { FormExperienceFormShell } from "@/types/experience-form-experience";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export interface ResolvedConfirmationEmailCta {
  url?: string;
  attachment?: {
    filename: string;
    content: Buffer;
  };
}

function buildStorageKeyFromAsset(
  tenant: string,
  mediaId: string,
  extension: string
): string {
  const safeTenant = tenant.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const ext = extension.replace(/^\./, "").toLowerCase() || "bin";
  return `${safeTenant}/${mediaId}/${mediaId}.${ext}`;
}

function publicDocumentFile(url: string): { absolutePath: string; filename: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname = trimmed.split("?")[0] ?? "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith("/documentos/") || pathname.includes("..")) return null;
  const filename = path.basename(pathname);
  if (!filename.toLowerCase().endsWith(".pdf")) return null;

  return {
    absolutePath: path.join(process.cwd(), "public", "documentos", filename),
    filename,
  };
}

async function attachmentFromPublicDocument(
  url: string
): Promise<ResolvedConfirmationEmailCta["attachment"]> {
  const document = publicDocumentFile(url);
  if (!document) return undefined;

  try {
    const content = await readFile(document.absolutePath);
    if (content.length === 0 || content.length > MAX_ATTACHMENT_BYTES) return undefined;
    return { filename: document.filename, content };
  } catch (error) {
    console.warn("[convocatoria] confirmation program file missing", {
      path: document.absolutePath,
      error,
    });
    return undefined;
  }
}

function attachmentFilename(originalName: string, storageKey: string): string {
  const trimmed = originalName.trim();
  if (trimmed) return trimmed;
  const fromKey = storageKey.split("/").pop();
  return fromKey?.trim() || "programa.pdf";
}

/**
 * Resuelve la URL del botón del correo y, si el archivo existe en almacenamiento,
 * prepara el adjunto para enviarlo junto al correo.
 */
export async function resolveConfirmationEmailCta(
  tenant: string,
  formShell: Pick<
    FormExperienceFormShell,
    "confirmationEmailCtaMediaId" | "confirmationEmailCtaUrl"
  >
): Promise<ResolvedConfirmationEmailCta> {
  const mediaId = formShell.confirmationEmailCtaMediaId?.trim();
  const storedUrl = formShell.confirmationEmailCtaUrl?.trim();

  if (mediaId) {
    const asset = await findMediaById(tenant, mediaId);
    if (asset) {
      const storageKey =
        storageKeyFromMediaUrl(asset.url) ??
        storageKeyFromMediaUrl(asset.thumbnail) ??
        buildStorageKeyFromAsset(tenant, asset._id, asset.extension);

      const file = await readMediaFile(storageKey);
      if (!file) {
        console.warn("[convocatoria] confirmation email CTA file missing in storage", {
          mediaId,
          storageKey,
          tenant,
        });
        return {};
      }

      const currentUrl = await resolveMediaStoragePublicUrl(storageKey);
      const url = resolvePublicUrl(currentUrl);
      const attachment =
        file.buffer.length > 0 && file.buffer.length <= MAX_ATTACHMENT_BYTES
          ? {
              filename: attachmentFilename(asset.originalName, storageKey),
              content: file.buffer,
            }
          : undefined;

      return { url, attachment };
    }

    console.warn("[convocatoria] confirmation email CTA media not found", { mediaId, tenant });
    return {};
  }

  if (storedUrl) {
    const storageKey = storageKeyFromMediaUrl(storedUrl);
    if (storageKey) {
      const file = await readMediaFile(storageKey);
      if (!file) {
        console.warn("[convocatoria] confirmation email CTA stored URL points to missing file", {
          storageKey,
          tenant,
        });
        return {};
      }

      const currentUrl = await resolveMediaStoragePublicUrl(storageKey);
      const url = resolvePublicUrl(currentUrl);
      const attachment =
        file.buffer.length > 0 && file.buffer.length <= MAX_ATTACHMENT_BYTES
          ? {
              filename: attachmentFilename("", storageKey),
              content: file.buffer,
            }
          : undefined;

      return { url, attachment };
    }

    const attachment = await attachmentFromPublicDocument(storedUrl);
    return { url: resolvePublicUrl(storedUrl), attachment };
  }

  return {};
}

/** @deprecated Usar resolveConfirmationEmailCta */
export async function resolveConfirmationEmailCtaUrl(
  tenant: string,
  formShell: Pick<
    FormExperienceFormShell,
    "confirmationEmailCtaMediaId" | "confirmationEmailCtaUrl"
  >
): Promise<string | undefined> {
  const resolved = await resolveConfirmationEmailCta(tenant, formShell);
  return resolved.url;
}
