import "server-only";

import { mapResolvedSlidesToPremiumViews } from "@/core/hero/map-slide";
import { resolveHeroSlidesFloatingCards } from "@/core/hero/resolve-floating-card";
import { resolveHeroSlides } from "@/core/hero/resolve";
import { buildHeroSlidesSignature } from "@/core/hero/slide-signature";
import { HeroPremiumSection } from "@/components/portal/sections/HeroPremiumSection";
import type { HeroPortalConfig } from "@/types/hero-portal";

interface HeroPortalSectionProps {
  tenant: string;
  heroPortal: HeroPortalConfig;
}

export async function HeroPortalSection({ tenant, heroPortal }: HeroPortalSectionProps) {
  const resolvedSlides = await resolveHeroSlides(tenant, heroPortal);

  if (resolvedSlides.length === 0) return null;

  await resolveHeroSlidesFloatingCards(tenant, resolvedSlides);

  const views = mapResolvedSlidesToPremiumViews(resolvedSlides);
  const slidesKey = buildHeroSlidesSignature(views);

  return (
    <HeroPremiumSection
      key={slidesKey}
      slides={views}
      type={heroPortal.type}
      carousel={heroPortal.carousel}
    />
  );
}
