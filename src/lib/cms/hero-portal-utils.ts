import { createEmptySlide } from "@/lib/cms/hero-portal-defaults";
import { sortSlidesForDisplay } from "@/lib/cms/hero-slide-display";
import type { HeroSlide } from "@/types/hero-portal";
import { HERO_SLIDE_MAX } from "@/types/hero-portal";

export function sortHeroSlides(slides: HeroSlide[]): HeroSlide[] {
  return sortSlidesForDisplay(slides);
}

export function reorderHeroSlides(
  slides: HeroSlide[],
  draggedId: string,
  targetId: string
): HeroSlide[] {
  const sorted = [...slides].sort((a, b) => a.order - b.order);
  const fromIndex = sorted.findIndex((s) => s.id === draggedId);
  const toIndex = sorted.findIndex((s) => s.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return slides;

  const next = [...sorted];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);

  return next.map((slide, index) => ({ ...slide, order: index }));
}

export function duplicateHeroSlide(slides: HeroSlide[], slideId: string): HeroSlide[] {
  const source = slides.find((s) => s.id === slideId);
  if (!source || slides.length >= HERO_SLIDE_MAX) return slides;

  const copy: HeroSlide = {
    ...structuredClone(source),
    id: createEmptySlide(0).id,
    content: {
      ...source.content,
      title: source.content.title ? `${source.content.title} (copia)` : "",
    },
    order: slides.length,
    publication: { status: "draft" },
  };

  return [...slides, copy].map((slide, index) => ({
    ...slide,
    order: index,
  }));
}

export function removeHeroSlide(slides: HeroSlide[], slideId: string): HeroSlide[] {
  return slides
    .filter((s) => s.id !== slideId)
    .map((slide, index) => ({
      ...slide,
      order: index,
    }));
}

export function addHeroSlide(slides: HeroSlide[]): HeroSlide[] {
  if (slides.length >= HERO_SLIDE_MAX) return slides;
  return [...slides, createEmptySlide(slides.length)];
}

export function alignmentToObjectPosition(
  alignment: HeroSlide["multimedia"]["alignment"],
  custom?: string
): string {
  if (alignment === "custom" && custom?.trim()) return custom.trim();
  const map: Record<HeroSlide["multimedia"]["alignment"], string> = {
    center: "center center",
    right: "right center",
    left: "left center",
    top: "center top",
    bottom: "center bottom",
    custom: "center center",
  };
  return map[alignment];
}
