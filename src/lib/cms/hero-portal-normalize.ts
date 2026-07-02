import {
  createDefaultHeroPortal,
  createEmptySlide,
  createSlideId,
} from "@/lib/cms/hero-portal-defaults";
import { sortSlidesForDisplay } from "@/lib/cms/hero-slide-display";
import {
  isLegacyHeroPortal,
  migrateHeroPortalToV2,
} from "@/lib/cms/hero-portal-migrate-v2";
import type { Branding } from "@/types/cms";
import type { HeroFeature } from "@/types/hero";
import type {
  HeroCarouselSettings,
  HeroPlacementContext,
  HeroPortalConfig,
  HeroSlide,
  HeroSlideActions,
  HeroSlideBenefits,
  HeroSlideContent,
  HeroSlideCta,
  HeroSlideFloatingCard,
  HeroSlideInstitutionalVideo,
  HeroSlideMultimedia,
  HeroSlidePriority,
  HeroSlidePublication,
  HeroSlideScheduling,
  HeroSlideSeo,
  HeroSlideStatistics,
} from "@/types/hero-portal";
import { HERO_SLIDE_MAX } from "@/types/hero-portal";

function normalizeCta(raw: unknown, fallback: HeroSlideCta): HeroSlideCta {
  if (!raw || typeof raw !== "object") return fallback;
  const cta = raw as Partial<HeroSlideCta>;
  return {
    text: typeof cta.text === "string" ? cta.text : fallback.text,
    url: typeof cta.url === "string" ? cta.url : fallback.url,
    openInNewTab: Boolean(cta.openInNewTab),
  };
}

function normalizeContent(raw: unknown, fallback: HeroSlideContent): HeroSlideContent {
  if (!raw || typeof raw !== "object") return fallback;
  const content = raw as Partial<HeroSlideContent>;
  return {
    eyebrow: typeof content.eyebrow === "string" ? content.eyebrow : fallback.eyebrow,
    title: typeof content.title === "string" ? content.title : fallback.title,
    highlight: typeof content.highlight === "string" ? content.highlight : fallback.highlight,
    subtitle: typeof content.subtitle === "string" ? content.subtitle : fallback.subtitle,
    description:
      typeof content.description === "string" ? content.description : fallback.description,
  };
}

function normalizeMultimedia(raw: unknown, fallback: HeroSlideMultimedia): HeroSlideMultimedia {
  if (!raw || typeof raw !== "object") return fallback;
  const multimedia = raw as Partial<HeroSlideMultimedia>;
  const overlayRaw = multimedia.overlay;

  return {
    desktopMediaId:
      typeof multimedia.desktopMediaId === "string"
        ? multimedia.desktopMediaId
        : fallback.desktopMediaId,
    mobileMediaId:
      typeof multimedia.mobileMediaId === "string"
        ? multimedia.mobileMediaId
        : fallback.mobileMediaId,
    imageAlt: typeof multimedia.imageAlt === "string" ? multimedia.imageAlt : fallback.imageAlt,
    overlay: {
      enabled:
        typeof overlayRaw?.enabled === "boolean" ? overlayRaw.enabled : fallback.overlay.enabled,
      color:
        typeof overlayRaw?.color === "string" && overlayRaw.color.startsWith("#")
          ? overlayRaw.color
          : fallback.overlay.color,
      opacity:
        typeof overlayRaw?.opacity === "number"
          ? Math.min(100, Math.max(0, overlayRaw.opacity))
          : fallback.overlay.opacity,
    },
    alignment:
      multimedia.alignment === "right" ||
      multimedia.alignment === "left" ||
      multimedia.alignment === "top" ||
      multimedia.alignment === "bottom" ||
      multimedia.alignment === "custom"
        ? multimedia.alignment
        : fallback.alignment,
    customAlignment:
      typeof multimedia.customAlignment === "string"
        ? multimedia.customAlignment
        : fallback.customAlignment,
  };
}

function normalizeFeatures(raw: unknown): HeroFeature[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is HeroFeature =>
        typeof item === "object" && item !== null && "title" in item
    )
    .map((item) => ({
      icon: typeof item.icon === "string" ? item.icon : "award",
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
    }));
}

function normalizePublication(raw: unknown): HeroSlidePublication {
  if (raw && typeof raw === "object" && "status" in raw) {
    const status = (raw as HeroSlidePublication).status;
    if (
      status === "draft" ||
      status === "published" ||
      status === "scheduled" ||
      status === "archived"
    ) {
      return { status };
    }
  }
  return { status: "draft" };
}

function normalizeScheduling(raw: unknown): HeroSlideScheduling {
  if (!raw || typeof raw !== "object") {
    return { showFrom: "", showUntil: "" };
  }
  const scheduling = raw as Partial<HeroSlideScheduling>;
  return {
    showFrom: typeof scheduling.showFrom === "string" ? scheduling.showFrom : "",
    showUntil: typeof scheduling.showUntil === "string" ? scheduling.showUntil : "",
  };
}

function normalizePriority(raw: unknown): HeroSlidePriority {
  if (raw === "principal" || raw === "featured" || raw === "normal") return raw;
  return "normal";
}

function normalizeSlideV2(raw: unknown, index: number): HeroSlide | null {
  if (!raw || typeof raw !== "object") return null;

  const slide = raw as Partial<HeroSlide>;
  const empty = createEmptySlide(index);
  const id = typeof slide.id === "string" && slide.id.trim() ? slide.id : createSlideId();

  const actionsPartial = slide.actions;
  const actions: HeroSlideActions = {
    enabled:
      typeof actionsPartial?.enabled === "boolean" ? actionsPartial.enabled : empty.actions.enabled,
    primary: normalizeCta(actionsPartial?.primary, empty.actions.primary),
    secondary: normalizeCta(actionsPartial?.secondary, empty.actions.secondary),
  };

  const floatingPartial = slide.floatingCard;
  const floatingCard: HeroSlideFloatingCard = {
    enabled:
      typeof floatingPartial?.enabled === "boolean"
        ? floatingPartial.enabled
        : empty.floatingCard.enabled,
    source:
      floatingPartial?.source === "next_academic_event" ||
      floatingPartial?.source === "featured_notice"
        ? floatingPartial.source
        : (floatingPartial?.source ?? empty.floatingCard.source ?? "manual"),
    icon: typeof floatingPartial?.icon === "string" ? floatingPartial.icon : empty.floatingCard.icon,
    title: typeof floatingPartial?.title === "string" ? floatingPartial.title : empty.floatingCard.title,
    subtitle:
      typeof floatingPartial?.subtitle === "string"
        ? floatingPartial.subtitle
        : empty.floatingCard.subtitle,
    description:
      typeof floatingPartial?.description === "string"
        ? floatingPartial.description
        : empty.floatingCard.description,
    button: normalizeCta(floatingPartial?.button, empty.floatingCard.button),
  };

  const benefitsPartial = slide.benefits;
  const benefits: HeroSlideBenefits = {
    enabled:
      typeof benefitsPartial?.enabled === "boolean"
        ? benefitsPartial.enabled
        : empty.benefits.enabled,
    items: normalizeFeatures(benefitsPartial?.items),
  };

  const videoPartial = slide.institutionalVideo;
  const institutionalVideo: HeroSlideInstitutionalVideo = {
    enabled:
      typeof videoPartial?.enabled === "boolean"
        ? videoPartial.enabled
        : empty.institutionalVideo.enabled,
    mediaId: typeof videoPartial?.mediaId === "string" ? videoPartial.mediaId : "",
    url: typeof videoPartial?.url === "string" ? videoPartial.url : "",
    posterMediaId:
      typeof videoPartial?.posterMediaId === "string" ? videoPartial.posterMediaId : "",
  };

  const statsPartial = slide.statistics;
  const statistics: HeroSlideStatistics = {
    enabled:
      typeof statsPartial?.enabled === "boolean"
        ? statsPartial.enabled
        : empty.statistics.enabled,
    items: Array.isArray(statsPartial?.items) ? statsPartial.items : [],
  };

  const seoPartial = slide.seo;
  const seo: HeroSlideSeo = {
    title: typeof seoPartial?.title === "string" ? seoPartial.title : "",
    description: typeof seoPartial?.description === "string" ? seoPartial.description : "",
    imageMediaId: typeof seoPartial?.imageMediaId === "string" ? seoPartial.imageMediaId : "",
  };

  return {
    id,
    order: typeof slide.order === "number" ? slide.order : index,
    priority: normalizePriority(slide.priority),
    content: normalizeContent(slide.content, empty.content),
    multimedia: normalizeMultimedia(slide.multimedia, empty.multimedia),
    actions,
    floatingCard,
    benefits,
    institutionalVideo,
    statistics,
    seo,
    publication: normalizePublication(slide.publication),
    scheduling: normalizeScheduling(slide.scheduling),
  };
}

function normalizeCarousel(raw: unknown): HeroCarouselSettings {
  const defaults = createDefaultHeroPortal().carousel;
  if (!raw || typeof raw !== "object") return defaults;
  const carousel = raw as Partial<HeroCarouselSettings>;

  const interval = carousel.interval;
  const validInterval =
    interval === 3 || interval === 5 || interval === 7 || interval === 10
      ? interval
      : defaults.interval;

  const transitionDuration = carousel.transitionDuration;
  const validDuration =
    transitionDuration === 0.5 || transitionDuration === 1
      ? transitionDuration
      : defaults.transitionDuration;

  return {
    autoplay: carousel.autoplay ?? defaults.autoplay,
    interval: validInterval,
    transition: carousel.transition === "slide" ? "slide" : "fade",
    transitionDuration: validDuration,
    showIndicators: carousel.showIndicators ?? defaults.showIndicators,
    showArrows: carousel.showArrows ?? defaults.showArrows,
    pauseOnHover: carousel.pauseOnHover ?? defaults.pauseOnHover,
    loop: carousel.loop ?? defaults.loop,
  };
}

function normalizeContext(raw: unknown): HeroPlacementContext {
  const valid: HeroPlacementContext[] = [
    "institutional_portal",
    "program_landing",
    "course_landing",
    "commercial_landing",
    "event",
    "campaign",
    "open_day",
  ];
  if (typeof raw === "string" && valid.includes(raw as HeroPlacementContext)) {
    return raw as HeroPlacementContext;
  }
  return "institutional_portal";
}

function normalizeHeroPortalV2(raw: unknown): HeroPortalConfig {
  const defaults = createDefaultHeroPortal();
  if (!raw || typeof raw !== "object") return defaults;

  const config = raw as Partial<HeroPortalConfig>;
  const type =
    config.type === "image" || config.type === "video" || config.type === "carousel"
      ? config.type
      : defaults.type;

  const slides = Array.isArray(config.slides)
    ? sortSlidesForDisplay(
        config.slides
          .map((slide, index) => normalizeSlideV2(slide, index))
          .filter((slide): slide is HeroSlide => slide !== null)
          .slice(0, HERO_SLIDE_MAX)
          .map((slide, index) => ({ ...slide, order: index }))
      )
    : [];

  return {
    enabled: Boolean(config.enabled),
    type,
    carousel: normalizeCarousel(config.carousel),
    context: normalizeContext(config.context),
    slides,
  };
}

/**
 * Normaliza heroPortal para lectura/escritura (esquema v2).
 * Si el módulo o los slides son legacy, migra en memoria hasta ejecutar `npm run migrate`.
 */
export function normalizeHeroPortal(
  raw: unknown,
  branding: Branding,
  moduleVersion = 0
): HeroPortalConfig {
  const source = isLegacyHeroPortal(raw, moduleVersion)
    ? migrateHeroPortalToV2(raw, branding)
    : raw;
  return normalizeHeroPortalV2(source);
}
