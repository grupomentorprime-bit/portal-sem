import "server-only";

import { findMediaById } from "@/core/media/lookup";
import { resolvePublicUrl } from "@/lib/app-url";
import {
  resolveMediaStoragePublicUrl,
  storageKeyFromMediaUrl,
} from "@/lib/cms/media-storage";
import type { FormExperienceFormShell } from "@/types/experience-form-experience";

function buildStorageKeyFromAsset(
  tenant: string,
  mediaId: string,
  extension: string
): string {
  const safeTenant = tenant.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const ext = extension.replace(/^\./, "").toLowerCase() || "bin";
  return `${safeTenant}/${mediaId}/${mediaId}.${ext}`;
}

/**
 * Resuelve la URL del botón del correo de confirmación usando el mediaId actual
 * y la configuración de almacenamiento vigente (evita URLs obsoletas guardadas en el formulario).
 */
export async function resolveConfirmationEmailCtaUrl(
  tenant: string,
  formShell: Pick<
    FormExperienceFormShell,
    "confirmationEmailCtaMediaId" | "confirmationEmailCtaUrl"
  >
): Promise<string | undefined> {
  const mediaId = formShell.confirmationEmailCtaMediaId?.trim();
  const storedUrl = formShell.confirmationEmailCtaUrl?.trim();

  if (mediaId) {
    const asset = await findMediaById(tenant, mediaId);
    if (asset) {
      const storageKey =
        storageKeyFromMediaUrl(asset.url) ??
        storageKeyFromMediaUrl(asset.thumbnail) ??
        buildStorageKeyFromAsset(tenant, asset._id, asset.extension);

      try {
        const currentUrl = await resolveMediaStoragePublicUrl(storageKey);
        return resolvePublicUrl(currentUrl);
      } catch (error) {
        console.warn("[convocatoria] failed to rebuild CTA media URL, using stored asset url", {
          mediaId,
          error,
        });
        return resolvePublicUrl(asset.url);
      }
    }

    console.warn("[convocatoria] confirmation email CTA media not found", { mediaId, tenant });
  }

  return resolvePublicUrl(storedUrl);
}
