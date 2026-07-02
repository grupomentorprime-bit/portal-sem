import type { PremiumHeroSlideView } from "@/core/hero/map-slide";

/** Firma estable del slide para invalidar estado/caché del Hero al cambiar cualquier campo CMS. */
export function buildHeroSlideViewSignature(slide: PremiumHeroSlideView): string {
  const card = slide.generationCard;
  return [
    slide.id,
    slide.eyebrow,
    slide.title,
    slide.highlight ?? "",
    slide.description,
    slide.imageAlt,
    slide.imagenDesktopUrl ?? "",
    slide.imagenMobileUrl ?? "",
    slide.objectPosition,
    String(slide.overlayEnabled),
    slide.overlayColor,
    String(slide.overlayOpacity),
    slide.primaryLabel,
    slide.primaryHref,
    slide.secondaryLabel,
    slide.secondaryHref,
    String(slide.showCta),
    String(slide.showBenefits),
    card?.label ?? "",
    card?.year ?? "",
    card?.description ?? "",
    card?.ctaLabel ?? "",
    card?.ctaHref ?? "",
    JSON.stringify(slide.features),
  ].join("\u001f");
}

export function buildHeroSlidesSignature(slides: PremiumHeroSlideView[]): string {
  return slides.map(buildHeroSlideViewSignature).join("\u001e");
}
