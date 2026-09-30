import type { HomeHeroPhotoRef } from "@/types/cms";
import type { CmsMediaAsset } from "@/types/media";

/** Tope de fotografías que el inicio puede rotar. */
export const HOME_HERO_PHOTO_LIMIT = 8;

/** Intervalo fijo de la rotación pública. */
export const HOME_HERO_INTERVAL_MS = 5000;

const MEDIA_ID = /^media-[a-z0-9-]+$/i;

export function isHomeHeroMediaId(value: string): boolean {
  return MEDIA_ID.test(value.trim());
}

/** Una fotografía de biblioteca, no un icono ni un documento. */
export function isHomeHeroPhotograph(asset: Pick<CmsMediaAsset, "category" | "mimeType" | "status">): boolean {
  if (asset.status === "archived") return false;
  if (asset.category === "Imagen") return true;
  return asset.mimeType.startsWith("image/") && asset.mimeType !== "image/svg+xml";
}

/** Normaliza lo guardado en configuración. Descarta ids inválidos y repetidos. */
export function normalizeHomeHeroPhotos(value: unknown): HomeHeroPhotoRef[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const photos: HomeHeroPhotoRef[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rawId = "mediaId" in item && typeof item.mediaId === "string" ? item.mediaId.trim() : "";
    if (!isHomeHeroMediaId(rawId) || seen.has(rawId)) continue;
    seen.add(rawId);
    const published = "published" in item ? item.published === true : false;
    photos.push({ mediaId: rawId, published });
    if (photos.length >= HOME_HERO_PHOTO_LIMIT) break;
  }

  return photos;
}

/** Las que el hero público debe mostrar, en el orden del CMS. */
export function publishedHomeHeroPhotos(photos: HomeHeroPhotoRef[]): HomeHeroPhotoRef[] {
  return normalizeHomeHeroPhotos(photos).filter((photo) => photo.published);
}

export function homeHeroPhotoErrors(
  photos: HomeHeroPhotoRef[] | undefined
): Array<{ field: string; message: string }> {
  if (!photos) return [];
  if (!Array.isArray(photos)) {
    return [
      {
        field: "branding.homeHeroPhotos",
        message: "Las fotografías del hero deben ser una lista.",
      },
    ];
  }

  const errors: Array<{ field: string; message: string }> = [];
  if (photos.length > HOME_HERO_PHOTO_LIMIT) {
    errors.push({
      field: "branding.homeHeroPhotos",
      message: `Máximo ${HOME_HERO_PHOTO_LIMIT} fotografías en el hero.`,
    });
  }

  const seen = new Set<string>();
  photos.forEach((photo, index) => {
    const mediaId = typeof photo?.mediaId === "string" ? photo.mediaId.trim() : "";
    if (!isHomeHeroMediaId(mediaId)) {
      errors.push({
        field: `branding.homeHeroPhotos[${index}].mediaId`,
        message: `Fotografía ${index + 1}: elige una imagen de la biblioteca.`,
      });
    } else if (seen.has(mediaId)) {
      errors.push({
        field: `branding.homeHeroPhotos[${index}].mediaId`,
        message: `Fotografía ${index + 1}: está repetida.`,
      });
    } else {
      seen.add(mediaId);
    }

    if (typeof photo?.published !== "boolean") {
      errors.push({
        field: `branding.homeHeroPhotos[${index}].published`,
        message: `Fotografía ${index + 1}: indica si está publicada.`,
      });
    }
  });

  return errors;
}
