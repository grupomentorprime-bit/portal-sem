/**
 * OT-CORE-HERO-002 — Migración legacy → Hero esquema v2.
 * Usado por `npm run migrate:hero-v2` y al leer documentos sin schemaVersion.
 */

import {
  createDefaultCarouselSettings,
  createDefaultHeroPortal,
  createPremiumSeedSlide,
  createSlideId,
  seedHeroPortalSlides,
} from "@/lib/cms/hero-portal-defaults";
import { colorDefaults } from "@/design/tokens/colors";
import { sortSlidesForDisplay } from "@/lib/cms/hero-slide-display";
import {
  DEFAULT_GENERATION_CARD,
  DEFAULT_HERO_FEATURES,
} from "@/lib/portal/hero-defaults";
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
import { HERO_PORTAL_MODULE_VERSION, HERO_SLIDE_MAX } from "@/types/hero-portal";

const LEGACY_SLIDE_KEYS = [
  "titulo",
  "descripcion",
  "subtitulo",
  "eyebrow",
  "highlight",
  "textoDestacado",
  "imagenDesktopId",
  "imagenMobileId",
  "imageAlt",
  "overlayEnabled",
  "overlayColor",
  "overlayOpacity",
  "alignment",
  "customAlignment",
  "ctaPrimary",
  "ctaSecondary",
  "showCta",
  "showFloatingCard",
  "showAdmissionCard",
  "generationCard",
  "features",
  "showBenefits",
  "showVideoCard",
  "showStats",
  "active",
] as const;

type LegacyFlatSlide = Record<string, unknown>;

export function isLegacyHeroSlide(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return true;
  const slide = raw as Record<string, unknown>;

  if (!slide.content || typeof slide.content !== "object") return true;
  if (!slide.multimedia || typeof slide.multimedia !== "object") return true;

  return LEGACY_SLIDE_KEYS.some((key) => key in slide);
}

export function isLegacyHeroPortal(raw: unknown, moduleVersion = 0): boolean {
  if (!raw || typeof raw !== "object") {
    return moduleVersion < HERO_PORTAL_MODULE_VERSION;
  }

  const config = raw as Record<string, unknown>;

  if (
    typeof config.schemaVersion === "number" &&
    config.schemaVersion < HERO_PORTAL_MODULE_VERSION
  ) {
    return true;
  }

  if (moduleVersion >= HERO_PORTAL_MODULE_VERSION) {
    const slides = config.slides;
    return Array.isArray(slides) && slides.some(isLegacyHeroSlide);
  }

  if (!config.slides || !Array.isArray(config.slides)) return true;

  return config.slides.some((slide) => isLegacyHeroSlide(slide));
}

function normalizeCta(raw: unknown, fallback: HeroSlideCta): HeroSlideCta {
  if (!raw || typeof raw !== "object") return fallback;
  const cta = raw as Partial<HeroSlideCta>;
  return {
    text: typeof cta.text === "string" ? cta.text : fallback.text,
    url: typeof cta.url === "string" ? cta.url : fallback.url,
    openInNewTab: Boolean(cta.openInNewTab),
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

function normalizePublication(raw: unknown, legacyActive?: boolean): HeroSlidePublication {
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

  if (legacyActive === false) return { status: "draft" };
  if (legacyActive === true) return { status: "published" };
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

function migrateLegacySlideToV2(raw: LegacyFlatSlide, index: number): HeroSlide {
  const contentPartial = raw.content as Partial<HeroSlideContent> | undefined;
  const multimediaPartial = raw.multimedia as Partial<HeroSlideMultimedia> | undefined;
  const id =
    typeof raw.id === "string" && raw.id.trim() ? raw.id : createSlideId();

  const legacyEyebrow =
    typeof raw.eyebrow === "string"
      ? raw.eyebrow
      : typeof raw.textoDestacado === "string"
        ? raw.textoDestacado
        : "";

  const content: HeroSlideContent = {
    eyebrow: contentPartial?.eyebrow ?? legacyEyebrow,
    title:
      contentPartial?.title ??
      (typeof raw.titulo === "string" ? raw.titulo : ""),
    highlight:
      contentPartial?.highlight ??
      (typeof raw.highlight === "string" ? raw.highlight : ""),
    subtitle:
      contentPartial?.subtitle ??
      (typeof raw.subtitulo === "string" ? raw.subtitulo : ""),
    description:
      contentPartial?.description ??
      (typeof raw.descripcion === "string" ? raw.descripcion : ""),
  };

  const multimedia: HeroSlideMultimedia = {
    desktopMediaId:
      multimediaPartial?.desktopMediaId ??
      (typeof raw.imagenDesktopId === "string" ? raw.imagenDesktopId : ""),
    mobileMediaId:
      multimediaPartial?.mobileMediaId ??
      (typeof raw.imagenMobileId === "string" ? raw.imagenMobileId : ""),
    imageAlt:
      multimediaPartial?.imageAlt ??
      (typeof raw.imageAlt === "string" ? raw.imageAlt : ""),
    overlay: {
      enabled:
        multimediaPartial?.overlay?.enabled ??
        raw.overlayEnabled !== false,
      color:
        multimediaPartial?.overlay?.color ??
        (typeof raw.overlayColor === "string" && raw.overlayColor.startsWith("#")
          ? raw.overlayColor
          : colorDefaults.primary),
      opacity:
        typeof multimediaPartial?.overlay?.opacity === "number"
          ? Math.min(100, Math.max(0, multimediaPartial.overlay.opacity))
          : typeof raw.overlayOpacity === "number"
            ? Math.min(100, Math.max(0, raw.overlayOpacity))
            : 40,
    },
    alignment:
      multimediaPartial?.alignment ??
      (raw.alignment === "right" ||
      raw.alignment === "left" ||
      raw.alignment === "top" ||
      raw.alignment === "bottom" ||
      raw.alignment === "custom"
        ? raw.alignment
        : "center"),
    customAlignment:
      multimediaPartial?.customAlignment ??
      (typeof raw.customAlignment === "string" ? raw.customAlignment : ""),
  };

  const actionsPartial = raw.actions as Partial<HeroSlideActions> | undefined;
  const actions: HeroSlideActions = {
    enabled: actionsPartial?.enabled ?? raw.showCta !== false,
    primary: normalizeCta(actionsPartial?.primary ?? raw.ctaPrimary, {
      text: "",
      url: "",
      openInNewTab: false,
    }),
    secondary: normalizeCta(actionsPartial?.secondary ?? raw.ctaSecondary, {
      text: "",
      url: "",
      openInNewTab: false,
    }),
  };

  const floatingPartial = raw.floatingCard as Partial<HeroSlideFloatingCard> | undefined;
  const legacyCard = raw.generationCard as
    | {
        enabled?: boolean;
        icon?: string;
        label?: string;
        subtitle?: string;
        year?: string;
        description?: string;
        ctaLabel?: string;
        ctaHref?: string;
      }
    | undefined;

  const showCard =
    floatingPartial?.enabled ??
    raw.showFloatingCard ??
    raw.showAdmissionCard ??
    Boolean(legacyCard?.enabled);

  const floatingCard: HeroSlideFloatingCard = {
    enabled: Boolean(showCard),
    source:
      floatingPartial?.source === "next_academic_event" ||
      floatingPartial?.source === "featured_notice"
        ? floatingPartial.source
        : "manual",
    icon: floatingPartial?.icon ?? legacyCard?.icon ?? "calendar",
    title: floatingPartial?.title ?? legacyCard?.label ?? DEFAULT_GENERATION_CARD.label,
    subtitle:
      floatingPartial?.subtitle ??
      legacyCard?.subtitle ??
      legacyCard?.year ??
      "",
    description: floatingPartial?.description ?? legacyCard?.description ?? "",
    button: normalizeCta(floatingPartial?.button, {
      text: legacyCard?.ctaLabel ?? "",
      url: legacyCard?.ctaHref ?? "",
      openInNewTab: false,
    }),
  };

  const benefitsPartial = raw.benefits as Partial<HeroSlideBenefits> | undefined;
  const benefits: HeroSlideBenefits = {
    enabled: benefitsPartial?.enabled ?? Boolean(raw.showBenefits),
    items:
      normalizeFeatures(benefitsPartial?.items ?? raw.features).length > 0
        ? normalizeFeatures(benefitsPartial?.items ?? raw.features)
        : raw.showBenefits
          ? DEFAULT_HERO_FEATURES
          : [],
  };

  const videoPartial = raw.institutionalVideo as
    | Partial<HeroSlideInstitutionalVideo>
    | undefined;
  const institutionalVideo: HeroSlideInstitutionalVideo = {
    enabled: videoPartial?.enabled ?? Boolean(raw.showVideoCard),
    mediaId: videoPartial?.mediaId ?? "",
    url: videoPartial?.url ?? "",
    posterMediaId: videoPartial?.posterMediaId ?? "",
  };

  const statsPartial = raw.statistics as Partial<HeroSlideStatistics> | undefined;
  const statistics: HeroSlideStatistics = {
    enabled: statsPartial?.enabled ?? Boolean(raw.showStats),
    items: Array.isArray(statsPartial?.items) ? statsPartial.items : [],
  };

  const seoPartial = raw.seo as Partial<HeroSlideSeo> | undefined;
  const seo: HeroSlideSeo = {
    title: seoPartial?.title ?? "",
    description: seoPartial?.description ?? "",
    imageMediaId: seoPartial?.imageMediaId ?? "",
  };

  return {
    id,
    order: typeof raw.order === "number" ? raw.order : index,
    priority: normalizePriority(raw.priority),
    content,
    multimedia,
    actions,
    floatingCard,
    benefits,
    institutionalVideo,
    statistics,
    seo,
    publication: normalizePublication(
      raw.publication,
      typeof raw.active === "boolean" ? raw.active : undefined
    ),
    scheduling: normalizeScheduling(raw.scheduling),
  };
}

function normalizeCarousel(raw: unknown): HeroCarouselSettings {
  const defaults = createDefaultCarouselSettings();
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

function seedEmptySlides(branding: Branding, slides: HeroSlide[]): HeroSlide[] {
  if (slides.length === 0) {
    return seedHeroPortalSlides(slides, branding);
  }

  const first = slides[0];
  if (!first) return slides;

  const isEmpty =
    !first.content.title.trim() &&
    !first.content.eyebrow.trim() &&
    !first.multimedia.desktopMediaId.trim() &&
    !first.multimedia.mobileMediaId.trim();

  if (!isEmpty) return slides;

  const seed = createPremiumSeedSlide(0, branding.heroMediaId);
  return [{ ...seed, id: first.id }, ...slides.slice(1)];
}

/** Convierte heroPortal legacy o parcial al esquema v2 sin campos planos */
export function migrateHeroPortalToV2(
  raw: unknown,
  branding: Branding
): HeroPortalConfig {
  const defaults = createDefaultHeroPortal();

  if (!raw || typeof raw !== "object") {
    return {
      ...defaults,
      slides: seedEmptySlides(branding, defaults.slides),
    };
  }

  const config = raw as Partial<HeroPortalConfig> & { slides?: unknown[] };
  const type =
    config.type === "image" || config.type === "video" || config.type === "carousel"
      ? config.type
      : defaults.type;

  const slides = Array.isArray(config.slides)
    ? sortSlidesForDisplay(
        config.slides
          .map((slide, index) =>
            migrateLegacySlideToV2(slide as unknown as LegacyFlatSlide, index)
          )
          .slice(0, HERO_SLIDE_MAX)
          .map((slide, index) => ({ ...slide, order: index }))
      )
    : [];

  return {
    enabled: Boolean(config.enabled),
    type,
    carousel: normalizeCarousel(config.carousel),
    context: normalizeContext(config.context),
    slides: seedEmptySlides(branding, slides),
  };
}

export interface HeroV2MigrationResult {
  configId: string;
  tenant: string;
  migrated: boolean;
  slideCount: number;
}
