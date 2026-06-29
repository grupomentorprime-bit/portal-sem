import "server-only";

import { PortalHero } from "@/components/portal/PortalHero";
import { PortalHeroBenefits, parseHeroBenefits } from "@/components/portal/PortalHeroBenefits";
import { blockSettings, extractStats, findBlock } from "@/lib/portal/blocks";
import { resolveMediaRef } from "@/core/media";
import { asString } from "@/lib/cms/block-utils";
import type { PortalContext } from "@/lib/portal/site";
import type { PageBlock } from "@/types/page";

interface HeroBlockSectionProps {
  block: PageBlock;
  tenant: string;
  ctx: PortalContext;
  allBlocks: PageBlock[];
}

export async function HeroBlockSection({ block, tenant, ctx, allBlocks }: HeroBlockSectionProps) {
  const { config, logos, navigation } = ctx;
  const { institution, seo } = config;

  const settings = blockSettings<{
    institutionName?: string;
    motto?: string;
    description?: string;
    heroImage?: string;
    heroMediaId?: string;
    heroImageAlt?: string;
    overlayOpacity?: number;
    badge?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    ctaLabel?: string;
    ctaHref?: string;
  }>(block);

  const applyQuickLink =
    navigation.quickLinks.find((l) => l.highlighted) ?? navigation.quickLinks[0];

  const statsBlock = findBlock(allBlocks, "stats");
  const stats = extractStats(statsBlock);

  const heroFromBlock = await resolveMediaRef(tenant, {
    mediaId: settings.heroMediaId,
    legacyUrl: settings.heroImage,
  });

  const configuredHeroImage = heroFromBlock ?? (logos.hasHero ? logos.hero : undefined);
  const heroImageAlt = asString(
    settings.heroImageAlt,
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
        overlayOpacity={
          typeof settings.overlayOpacity === "number" ? settings.overlayOpacity : 75
        }
        primaryLabel={asString(settings.primaryLabel, applyQuickLink?.label)}
        primaryHref={asString(settings.primaryHref, applyQuickLink?.href)}
        secondaryLabel={asString(settings.secondaryLabel, settings.ctaLabel)}
        secondaryHref={asString(settings.secondaryHref, settings.ctaHref)}
      />
      {heroBenefits.length > 0 ? <PortalHeroBenefits items={heroBenefits} /> : null}
    </>
  );
}
