import type { HeroSlide, HeroSlidePriority } from "@/types/hero-portal";

const PRIORITY_WEIGHT: Record<HeroSlidePriority, number> = {
  principal: 0,
  featured: 1,
  normal: 2,
};

export function parseHeroDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function isWithinSchedulingWindow(
  slide: HeroSlide,
  at: Date,
  requireScheduledFrom: boolean
): boolean {
  const from = parseHeroDate(slide.scheduling.showFrom);
  const until = parseHeroDate(slide.scheduling.showUntil);

  if (requireScheduledFrom && !from) return false;
  if (from && at < startOfDay(from)) return false;
  if (until && at > endOfDay(until)) return false;
  return true;
}

/**
 * Determina si un slide debe mostrarse en el portal público.
 * En modo preview del editor se incluyen borradores y programados fuera de fecha.
 */
export function isSlideVisibleForDisplay(
  slide: HeroSlide,
  options: { at?: Date; preview?: boolean } = {}
): boolean {
  const at = options.at ?? new Date();
  const preview = options.preview ?? false;
  const { status } = slide.publication;

  if (status === "archived") return false;

  if (preview) {
    return true;
  }

  if (status === "draft") return false;

  if (status === "scheduled") {
    return isWithinSchedulingWindow(slide, at, true);
  }

  return isWithinSchedulingWindow(slide, at, false);
}

/** Ordena slides: prioridad (principal → destacado → normal) y luego orden manual */
export function sortSlidesForDisplay(slides: HeroSlide[]): HeroSlide[] {
  return [...slides].sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.order - b.order;
  });
}

export function getDisplaySlides(
  slides: HeroSlide[],
  options: { preview?: boolean; at?: Date } = {}
): HeroSlide[] {
  return sortSlidesForDisplay(slides).filter((slide) =>
    isSlideVisibleForDisplay(slide, options)
  );
}

export function getPublicationStatusLabel(status: HeroSlide["publication"]["status"]): string {
  const labels: Record<HeroSlide["publication"]["status"], string> = {
    draft: "Borrador",
    published: "Publicado",
    scheduled: "Programado",
    archived: "Archivado",
  };
  return labels[status];
}

export function slideHasPublishableContent(slide: HeroSlide): boolean {
  return slide.publication.status === "published" || slide.publication.status === "scheduled";
}
