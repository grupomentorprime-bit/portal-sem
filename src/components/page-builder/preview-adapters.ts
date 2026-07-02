import { asArray, asString, type StatItemSettings } from "@/lib/cms/block-utils";
import { colorDefaults } from "@/design/tokens/colors";
import type { PremiumHeroSlideView } from "@/core/hero/map-slide";
import type { StatItem } from "@/lib/portal/blocks";

/** Adapta settings legacy del page-builder a un slide Hero Premium para preview CMS. */
export function buildLegacyHeroPreviewSlide(
  settings: Record<string, unknown>,
  defaults: {
    institutionName: string;
    heroImage: string;
    ctaLabel: string;
    ctaHref: string;
  }
): PremiumHeroSlideView {
  return {
    id: "preview-legacy-hero",
    eyebrow: defaults.institutionName,
    title: asString(settings.title, defaults.institutionName),
    highlight: undefined,
    description: asString(settings.motto),
    imageAlt: defaults.institutionName,
    imagenDesktopUrl: defaults.heroImage,
    imagenMobileUrl: defaults.heroImage,
    objectPosition: "center",
    overlayEnabled: true,
    overlayColor: colorDefaults.primary,
    overlayOpacity: 75,
    primaryLabel: defaults.ctaLabel,
    primaryHref: defaults.ctaHref,
    secondaryLabel: "",
    secondaryHref: "",
    showCta: true,
    features: [],
    showBenefits: false,
  };
}

export function mapLegacyStatItems(settings: Record<string, unknown>): StatItem[] {
  return asArray<StatItemSettings>(settings.items).map((item) => ({
    id: item.id,
    value: asString(item.value),
    label: asString(item.label),
  }));
}
