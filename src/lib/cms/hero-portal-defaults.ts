import {
  DEFAULT_GENERATION_CARD,
  DEFAULT_HERO_FEATURES,
  DEFAULT_SEM_PREMIUM_HERO,
} from "@/lib/portal/hero-defaults";
import { colorDefaults } from "@/design/tokens/colors";
import type { Branding } from "@/types/cms";
import type {
  HeroCarouselSettings,
  HeroPortalConfig,
  HeroSlide,
  HeroSlideActions,
  HeroSlideBenefits,
  HeroSlideContent,
  HeroSlideFloatingCard,
  HeroSlideInstitutionalVideo,
  HeroSlideMultimedia,
  HeroSlidePublication,
  HeroSlideScheduling,
  HeroSlideSeo,
  HeroSlideStatistics,
} from "@/types/hero-portal";
import { HERO_SLIDE_MAX } from "@/types/hero-portal";

export function createSlideId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultCarouselSettings(): HeroCarouselSettings {
  return {
    autoplay: true,
    interval: 5,
    transition: "fade",
    transitionDuration: 0.5,
    showIndicators: true,
    showArrows: true,
    pauseOnHover: true,
    loop: true,
  };
}

function defaultContent(): HeroSlideContent {
  return {
    eyebrow: "",
    title: "",
    highlight: "",
    subtitle: "",
    description: "",
  };
}

function defaultMultimedia(): HeroSlideMultimedia {
  return {
    desktopMediaId: "",
    mobileMediaId: "",
    imageAlt: "",
    overlay: {
      enabled: true,
      color: colorDefaults.primary,
      opacity: 40,
    },
    alignment: "center",
    customAlignment: "",
  };
}

function defaultActions(): HeroSlideActions {
  return {
    enabled: true,
    primary: { text: "", url: "", openInNewTab: false },
    secondary: { text: "", url: "", openInNewTab: false },
  };
}

function defaultFloatingCard(): HeroSlideFloatingCard {
  return {
    enabled: false,
    source: "manual",
    icon: "calendar",
    title: "",
    subtitle: "",
    description: "",
    button: { text: "", url: "", openInNewTab: false },
  };
}

function defaultBenefits(): HeroSlideBenefits {
  return {
    enabled: false,
    items: [],
  };
}

function defaultInstitutionalVideo(): HeroSlideInstitutionalVideo {
  return {
    enabled: false,
    mediaId: "",
    url: "",
    posterMediaId: "",
  };
}

function defaultStatistics(): HeroSlideStatistics {
  return {
    enabled: false,
    items: [],
  };
}

function defaultSeo(): HeroSlideSeo {
  return {
    title: "",
    description: "",
    imageMediaId: "",
  };
}

function defaultPublication(): HeroSlidePublication {
  return { status: "draft" };
}

function defaultScheduling(): HeroSlideScheduling {
  return { showFrom: "", showUntil: "" };
}

export function createEmptySlide(order: number): HeroSlide {
  return {
    id: createSlideId(),
    order,
    priority: "normal",
    content: defaultContent(),
    multimedia: defaultMultimedia(),
    actions: defaultActions(),
    floatingCard: defaultFloatingCard(),
    benefits: defaultBenefits(),
    institutionalVideo: defaultInstitutionalVideo(),
    statistics: defaultStatistics(),
    seo: defaultSeo(),
    publication: defaultPublication(),
    scheduling: defaultScheduling(),
  };
}

/** Slide 1 — contenido Premium SEM migrado desde el hero estático */
export function createPremiumSeedSlide(order: number, heroMediaId?: string): HeroSlide {
  const defaults = DEFAULT_SEM_PREMIUM_HERO;
  const card = defaults.generationCard ?? DEFAULT_GENERATION_CARD;
  const mediaId = heroMediaId?.trim() ?? "";

  return {
    ...createEmptySlide(order),
    priority: "principal",
    content: {
      eyebrow: defaults.eyebrow ?? "",
      title: defaults.title ?? "",
      highlight: defaults.highlight ?? "",
      subtitle: "",
      description: defaults.description ?? "",
    },
    multimedia: {
      ...defaultMultimedia(),
      desktopMediaId: mediaId,
      mobileMediaId: mediaId,
      imageAlt: defaults.imageAlt ?? "",
    },
    actions: {
      enabled: true,
      primary: {
        text: defaults.primaryCta?.label ?? "",
        url: defaults.primaryCta?.href ?? "",
        openInNewTab: false,
      },
      secondary: {
        text: defaults.secondaryCta?.label ?? "",
        url: defaults.secondaryCta?.href ?? "",
        openInNewTab: false,
      },
    },
    floatingCard: {
      enabled: true,
      source: "manual",
      icon: "calendar",
      title: card.label,
      subtitle: card.year,
      description: card.description,
      button: {
        text: card.ctaLabel,
        url: card.ctaHref,
        openInNewTab: false,
      },
    },
    benefits: {
      enabled: true,
      items: defaults.features ?? DEFAULT_HERO_FEATURES,
    },
    publication: { status: "published" },
  };
}

/** Garantiza Slide 1 con contenido Premium + Slide 2 vacío al inicializar */
export function seedHeroPortalSlides(slides: HeroSlide[], branding: Branding): HeroSlide[] {
  if (slides.length > 0) return slides;

  const mediaId = branding.heroMediaId?.trim() ?? "";

  return [
    createPremiumSeedSlide(0, mediaId),
    { ...createEmptySlide(1), publication: { status: "draft" } },
  ];
}

export function createDefaultHeroPortal(): HeroPortalConfig {
  return {
    enabled: false,
    type: "carousel",
    carousel: createDefaultCarouselSettings(),
    context: "institutional_portal",
    slides: [],
  };
}
