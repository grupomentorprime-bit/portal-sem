import "server-only";

import { HeroPortalSection } from "@/components/portal/sections/HeroPortalSection";
import { HeroPremiumSection } from "@/components/portal/sections/HeroPremiumSection";
import { PortalHero } from "@/components/portal/PortalHero";
import { PortalHeroBenefits, parseHeroBenefits } from "@/components/portal/PortalHeroBenefits";
import { mapResolvedSlideToPremiumView } from "@/core/hero/map-slide";
import { resolveConvocatoriaHeroLinks } from "@/core/hero/resolve-convocatoria-hero-links";
import { blockSettings, extractStats, findBlock } from "@/lib/portal/blocks";
import {
  DEFAULT_GENERATION_CARD,
  DEFAULT_HERO_FEATURES,
  DEFAULT_SEM_PREMIUM_HERO,
} from "@/lib/portal/hero-defaults";
import { resolveMediaRef } from "@/core/media";
import { asString } from "@/lib/cms/block-utils";
import { createPremiumSeedSlide } from "@/lib/cms/hero-portal-defaults";
import { isSlideVisibleForDisplay } from "@/lib/cms/hero-slide-display";
import type { PortalContext } from "@/lib/portal/site";
import type { HeroFeature, HeroGenerationCard, SemPremiumHeroSettings } from "@/types/hero";
import type { ResolvedHeroSlide } from "@/types/hero-portal";
import type { PageBlock } from "@/types/page";

interface HeroBlockSectionProps {
  block: PageBlock;
  tenant: string;
  ctx: PortalContext;
  allBlocks: PageBlock[];
}

function parseGenerationCard(raw: unknown): HeroGenerationCard {
  const defaults = DEFAULT_GENERATION_CARD;
  if (!raw || typeof raw !== "object") return defaults;
  const card = raw as Partial<HeroGenerationCard>;
  return {
    enabled: card.enabled ?? defaults.enabled,
    label: asString(card.label, defaults.label),
    year: asString(card.year, defaults.year),
    description: asString(card.description, defaults.description),
    ctaLabel: asString(card.ctaLabel, defaults.ctaLabel),
    ctaHref: asString(card.ctaHref, defaults.ctaHref),
  };
}

function parseFeatures(raw: unknown): HeroFeature[] {
  const defaults = DEFAULT_HERO_FEATURES;
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  const parsed = raw
    .filter((item): item is HeroFeature => {
      return typeof item === "object" && item !== null && "title" in item;
    })
    .slice(0, defaults.length);

  if (parsed.length === 0) return defaults;

  return defaults.map((feature, index) => ({
    icon: asString(parsed[index]?.icon, feature.icon),
    title: asString(parsed[index]?.title, feature.title),
    description: feature.description,
  }));
}

function blockToResolvedSlide(
  settings: SemPremiumHeroSettings & Record<string, unknown>,
  heroImageUrl?: string
): ResolvedHeroSlide {
  const primaryCta = settings.primaryCta ?? DEFAULT_SEM_PREMIUM_HERO.primaryCta!;
  const secondaryCta = settings.secondaryCta ?? DEFAULT_SEM_PREMIUM_HERO.secondaryCta!;
  const generationCard = parseGenerationCard(settings.generationCard);
  const features = parseFeatures(settings.features);

  const base = createPremiumSeedSlide(0);
  const slide: ResolvedHeroSlide = {
    ...base,
    id: "block-hero-static",
    content: {
      eyebrow: asString(settings.eyebrow, DEFAULT_SEM_PREMIUM_HERO.eyebrow!),
      title: asString(settings.title, DEFAULT_SEM_PREMIUM_HERO.title!),
      highlight: asString(settings.highlight, DEFAULT_SEM_PREMIUM_HERO.highlight!),
      subtitle: "",
      description: asString(settings.description, DEFAULT_SEM_PREMIUM_HERO.description!),
    },
    multimedia: {
      ...base.multimedia,
      imageAlt: asString(
        settings.imageAlt,
        asString(settings.heroImageAlt, DEFAULT_SEM_PREMIUM_HERO.imageAlt!)
      ),
    },
    actions: {
      enabled: true,
      primary: {
        text: asString(primaryCta.label, "Postular ahora →"),
        url: asString(primaryCta.href, "/admision"),
        openInNewTab: false,
      },
      secondary: {
        text: asString(secondaryCta.label, "Explorar programas"),
        url: asString(secondaryCta.href, "/programas"),
        openInNewTab: false,
      },
    },
    floatingCard: {
      enabled: generationCard.enabled,
      icon: generationCard.icon ?? "calendar",
      title: generationCard.label,
      subtitle: generationCard.subtitle ?? generationCard.year,
      description: generationCard.description,
      button: {
        text: generationCard.ctaLabel,
        url: generationCard.ctaHref,
        openInNewTab: false,
      },
    },
    benefits: {
      enabled: true,
      items: features,
    },
    publication: { status: "published" },
    imagenDesktopUrl: heroImageUrl,
    imagenMobileUrl: heroImageUrl,
  };

  return slide;
}

export async function HeroBlockSection({ block, tenant, ctx, allBlocks }: HeroBlockSectionProps) {
  const { config, logos, navigation } = ctx;
  const { institution, seo } = config;

  const settings = blockSettings<
    Record<string, unknown> & SemPremiumHeroSettings & {
      institutionName?: string;
      motto?: string;
      heroImageAlt?: string;
      overlayOpacity?: number;
      badge?: string;
      primaryLabel?: string;
      primaryHref?: string;
      secondaryLabel?: string;
      secondaryHref?: string;
      ctaLabel?: string;
      ctaHref?: string;
    }
  >(block);

  const variant = asString(settings.variant, "default");

  const { heroPortal } = config;

  if (heroPortal?.enabled && heroPortal.slides.some((s) => isSlideVisibleForDisplay(s))) {
    return <HeroPortalSection tenant={tenant} heroPortal={heroPortal} />;
  }

  const heroFromBlock = await resolveMediaRef(tenant, {
    mediaId: settings.heroMediaId,
    legacyUrl: settings.heroImage,
  });

  const configuredHeroImage = heroFromBlock ?? (logos.hasHero ? logos.hero : undefined);

  if (variant === "sem_premium") {
    const resolved = blockToResolvedSlide(settings, configuredHeroImage);
    resolveConvocatoriaHeroLinks([resolved]);
    const view = mapResolvedSlideToPremiumView(resolved);

    return <HeroPremiumSection slides={[view]} type="image" />;
  }

  const applyQuickLink =
    navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];

  const statsBlock = findBlock(allBlocks, "stats");
  const stats = extractStats(statsBlock);

  const heroImageAlt = asString(
    settings.heroImageAlt ?? settings.imageAlt,
    asString(settings.institutionName, institution.name)
  );

  const benefitItems = parseHeroBenefits(settings.badge);
  const statBenefits = stats.map((s) => s.label).filter(Boolean).slice(0, 4);
  const heroBenefits = benefitItems.length > 0 ? benefitItems : statBenefits;

  return (
    <>
      <PortalHero
        title={asString(settings.institutionName, institution.name)}
        subtitle={asString(settings.motto, seo.description)}
        description={asString(settings.description) || undefined}
        heroImage={configuredHeroImage}
        heroImageAlt={heroImageAlt}
        overlayOpacity={typeof settings.overlayOpacity === "number" ? settings.overlayOpacity : 75}
        primaryLabel={asString(settings.primaryLabel, applyQuickLink?.label)}
        primaryHref={asString(settings.primaryHref, applyQuickLink?.href)}
        secondaryLabel={asString(settings.secondaryLabel, settings.ctaLabel)}
        secondaryHref={asString(settings.secondaryHref, settings.ctaHref)}
      />
      {heroBenefits.length > 0 ? <PortalHeroBenefits items={heroBenefits} /> : null}
    </>
  );
}
