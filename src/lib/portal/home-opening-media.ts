import "server-only";

import { findMediaById } from "@/core/media/lookup";
import { resolveMediaRef, resolveMediaUrl } from "@/core/media";
import {
  isHomeHeroPhotograph,
  publishedHomeHeroPhotos,
} from "@/lib/cms/home-hero-photos";
import type { HomeHeroPhotoRef } from "@/types/cms";
import {
  homeOpeningForTenant,
  type HomeOpeningImage,
  type ResolvedHomeOpening,
  type ResolvedHomeOpeningImage,
} from "@/lib/portal/home-opening";

async function resolveSlot(
  tenantId: string,
  slot: HomeOpeningImage
): Promise<ResolvedHomeOpeningImage> {
  if (slot.mediaId) {
    const fromLibrary = await resolveMediaRef(tenantId, { mediaId: slot.mediaId }, "w1920");
    if (fromLibrary) {
      return { src: fromLibrary, alt: slot.alt, provisional: false };
    }
  }

  return {
    src: slot.provisionalSrc,
    alt: slot.alt,
    provisional: true,
  };
}

async function resolvePublishedPhoto(
  tenantId: string,
  photo: HomeHeroPhotoRef
): Promise<ResolvedHomeOpeningImage | null> {
  const asset = await findMediaById(tenantId, photo.mediaId);
  if (!asset || !isHomeHeroPhotograph(asset)) return null;

  const src = await resolveMediaUrl(tenantId, photo.mediaId, "w1920");
  if (!src) return null;

  return {
    src,
    alt: asset.alt?.trim() ?? "",
    provisional: false,
    mediaId: photo.mediaId,
  };
}

/**
 * Fotografías publicadas del CMS. Si no hay ninguna usable,
 * queda la fotografía de respaldo del modelo.
 */
async function resolveHeroPhotos(
  tenantId: string,
  fallback: HomeOpeningImage,
  heroPhotos: HomeHeroPhotoRef[]
): Promise<ResolvedHomeOpeningImage[]> {
  const published = publishedHomeHeroPhotos(heroPhotos);
  if (published.length === 0) {
    return [await resolveSlot(tenantId, fallback)];
  }

  const resolved = await Promise.all(
    published.map((photo) => resolvePublishedPhoto(tenantId, photo))
  );
  const photos = resolved.filter((photo): photo is ResolvedHomeOpeningImage => photo !== null);
  if (photos.length === 0) {
    return [await resolveSlot(tenantId, fallback)];
  }
  return photos;
}

/** Resuelve cada fotografía contra la biblioteca del Espacio. */
export async function resolveHomeOpening(
  tenantId: string,
  heroPhotos: HomeHeroPhotoRef[] = []
): Promise<ResolvedHomeOpening | null> {
  const content = homeOpeningForTenant(tenantId);
  if (!content) return null;

  const [heroPhotosResolved, main, top, bottom, ...lineImages] = await Promise.all([
    resolveHeroPhotos(tenantId, content.hero.image, heroPhotos),
    resolveSlot(tenantId, content.presentation.images[0]),
    resolveSlot(tenantId, content.presentation.images[1]),
    resolveSlot(tenantId, content.presentation.images[2]),
    ...content.lines.items.map((item) => resolveSlot(tenantId, item.image)),
  ]);

  const hero = heroPhotosResolved[0] ?? {
    src: content.hero.image.provisionalSrc,
    alt: content.hero.image.alt,
    provisional: true,
  };

  return {
    ...content,
    hero: { ...content.hero, image: hero, photos: heroPhotosResolved },
    presentation: {
      ...content.presentation,
      images: [main, top, bottom],
    },
    lines: {
      ...content.lines,
      items: content.lines.items.map((item, index) => ({
        ...item,
        image: lineImages[index] ?? { src: item.image.provisionalSrc, alt: "", provisional: true },
      })),
    },
  };
}
