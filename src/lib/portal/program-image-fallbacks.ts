/**
 * OT-UX-HOME-003 — Imágenes demo cuando el CMS no tiene foto del programa.
 */

import {
  PROGRAM_CARD_FALLBACKS,
  PROGRAM_HERO_GALLERY_FALLBACKS,
} from "@/lib/portal/program-demo-assets";

export function withProgramImageFallback<T extends { image?: string }>(
  item: T,
  index: number
): T {
  if (item.image?.trim()) return item;
  return {
    ...item,
    image: PROGRAM_CARD_FALLBACKS[index % PROGRAM_CARD_FALLBACKS.length],
  };
}

export function withProgramImageFallbacks<T extends { image?: string }>(
  items: T[]
): T[] {
  return items.map((item, index) => withProgramImageFallback(item, index));
}

export function resolveProgramHeroGalleryImage(
  programs: { image?: string }[],
  activeIndex = 0
): string {
  const fromProgram = programs[activeIndex]?.image?.trim();
  if (fromProgram) return fromProgram;
  return PROGRAM_HERO_GALLERY_FALLBACKS[
    activeIndex % PROGRAM_HERO_GALLERY_FALLBACKS.length
  ];
}
