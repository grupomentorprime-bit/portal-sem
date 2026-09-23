import "server-only";

import { mapResolvedSlidesToPremiumViews } from "@/core/hero/map-slide";
import { resolveConvocatoriaHeroLinks } from "@/core/hero/resolve-convocatoria-hero-links";
import { resolveHeroSlidesFloatingCards } from "@/core/hero/resolve-floating-card";
import { resolveHeroSlides } from "@/core/hero/resolve";
import { buildHeroSlidesSignature } from "@/core/hero/slide-signature";
import { HeroPremiumSection } from "@/components/portal/sections/HeroPremiumSection";
import { SEM_HERO_COPY } from "@/lib/portal/sem-identity-v7";
import type { HeroPortalConfig, ResolvedHeroSlide } from "@/types/hero-portal";

interface HeroPortalSectionProps {
  tenant: string;
  heroPortal: HeroPortalConfig;
  brandMarkSrc?: string;
  /** Sustituye el mensaje de la primera diapositiva. No borra las diapositivas del CMS. */
  useApprovedMessage?: boolean;
}

function withApprovedMessage(slide: ResolvedHeroSlide): ResolvedHeroSlide {
  return {
    ...slide,
    content: {
      ...slide.content,
      eyebrow: SEM_HERO_COPY.eyebrow,
      title: SEM_HERO_COPY.title,
      highlight: SEM_HERO_COPY.highlight,
      description: SEM_HERO_COPY.description,
    },
    actions: {
      ...slide.actions,
      enabled: true,
      primary: {
        ...slide.actions.primary,
        text: SEM_HERO_COPY.primaryText,
        url: SEM_HERO_COPY.primaryUrl,
      },
      secondary: {
        ...slide.actions.secondary,
        text: SEM_HERO_COPY.secondaryText,
        url: SEM_HERO_COPY.secondaryUrl,
      },
    },
    benefits: {
      enabled: true,
      items: [
        { icon: "monitor", title: "100% online", description: "Formación completamente en línea" },
        { icon: "video", title: "Clases en vivo cada lunes", description: "Nos encontramos el lunes" },
        { icon: "book", title: "Plataforma académica", description: "Estudio y actividades en la semana" },
      ],
    },
    floatingCard: {
      ...slide.floatingCard,
      enabled: false,
    },
  };
}

export async function HeroPortalSection({
  tenant,
  heroPortal,
  brandMarkSrc,
  useApprovedMessage = false,
}: HeroPortalSectionProps) {
  const resolved = await resolveHeroSlides(tenant, heroPortal);
  if (resolved.length === 0) return null;

  await resolveHeroSlidesFloatingCards(tenant, resolved);
  resolveConvocatoriaHeroLinks(resolved);

  const resolvedSlides = useApprovedMessage && resolved[0]
    ? [withApprovedMessage(resolved[0])]
    : resolved;

  const views = mapResolvedSlidesToPremiumViews(resolvedSlides);
  const slidesKey = buildHeroSlidesSignature(views);

  return (
    <HeroPremiumSection
      key={slidesKey}
      slides={views}
      type={heroPortal.type}
      carousel={heroPortal.carousel}
      brandMarkSrc={brandMarkSrc}
    />
  );
}
