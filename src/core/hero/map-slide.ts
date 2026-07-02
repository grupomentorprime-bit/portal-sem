import { alignmentToObjectPosition } from "@/lib/cms/hero-portal-utils";
import type { HeroFeature, HeroGenerationCard } from "@/types/hero";
import type { HeroSlideFloatingCard, ResolvedHeroSlide } from "@/types/hero-portal";

export interface PremiumHeroSlideView {
  id: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  imageAlt: string;
  imagenDesktopUrl?: string;
  imagenMobileUrl?: string;
  objectPosition: string;
  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;
  primaryLabel: string;
  primaryHref: string;
  primaryOpenInNewTab?: boolean;
  secondaryLabel: string;
  secondaryHref: string;
  secondaryOpenInNewTab?: boolean;
  showCta: boolean;
  generationCard?: HeroGenerationCard;
  features: HeroFeature[];
  showBenefits: boolean;
}

function mapFloatingCardToGenerationCard(
  card: HeroSlideFloatingCard
): HeroGenerationCard | undefined {
  if (!card.enabled) return undefined;
  return {
    enabled: true,
    icon: card.icon?.trim() || "calendar",
    label: card.title,
    subtitle: card.subtitle,
    year: card.subtitle,
    description: card.description,
    ctaLabel: card.button.text,
    ctaHref: card.button.url,
  };
}

function mapFeatures(items: HeroFeature[]): HeroFeature[] {
  return items
    .filter((item) => typeof item === "object" && item !== null && "title" in item)
    .map((feature) => ({
      icon: feature.icon?.trim() || "award",
      title: feature.title ?? "",
      description: feature.description ?? "",
    }));
}

export function mapResolvedSlideToPremiumView(slide: ResolvedHeroSlide): PremiumHeroSlideView {
  const { content, multimedia, actions, floatingCard, benefits } = slide;
  const generationCard = mapFloatingCardToGenerationCard(floatingCard);

  return {
    id: slide.id,
    eyebrow: content.eyebrow,
    title: content.title,
    highlight: content.highlight || undefined,
    description: content.description,
    imageAlt: multimedia.imageAlt || content.title,
    imagenDesktopUrl: slide.imagenDesktopUrl,
    imagenMobileUrl: slide.imagenMobileUrl,
    objectPosition: alignmentToObjectPosition(
      multimedia.alignment,
      multimedia.customAlignment
    ),
    overlayEnabled: multimedia.overlay.enabled,
    overlayColor: multimedia.overlay.color,
    overlayOpacity: multimedia.overlay.opacity,
    primaryLabel: actions.primary.text,
    primaryHref: actions.primary.url,
    primaryOpenInNewTab: actions.primary.openInNewTab,
    secondaryLabel: actions.secondary.text,
    secondaryHref: actions.secondary.url,
    secondaryOpenInNewTab: actions.secondary.openInNewTab,
    showCta: actions.enabled,
    generationCard,
    features: benefits.enabled ? mapFeatures(benefits.items) : [],
    showBenefits: benefits.enabled,
  };
}

export function mapResolvedSlidesToPremiumViews(slides: ResolvedHeroSlide[]): PremiumHeroSlideView[] {
  return slides.map(mapResolvedSlideToPremiumView);
}
