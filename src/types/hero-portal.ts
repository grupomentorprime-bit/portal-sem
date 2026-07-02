import type { HeroFeature } from "@/types/hero";

/** OT-HERO-006 — Módulo Core Hero (CMS First) */

export type HeroPortalType = "image" | "carousel" | "video";

export type HeroTransition = "fade" | "slide";

export type HeroAlignment =
  | "center"
  | "right"
  | "left"
  | "top"
  | "bottom"
  | "custom";

export type HeroCarouselInterval = 3 | 5 | 7 | 10;

export type HeroTransitionDuration = 0.5 | 1;

/** Estados de publicación por slide */
export type HeroPublicationStatus = "draft" | "published" | "scheduled" | "archived";

/** Prioridad de visualización (independiente del orden manual) */
export type HeroSlidePriority = "principal" | "featured" | "normal";

/** Contextos de reutilización del módulo Hero */
export type HeroPlacementContext =
  | "institutional_portal"
  | "program_landing"
  | "course_landing"
  | "commercial_landing"
  | "event"
  | "campaign"
  | "open_day";

export interface HeroCarouselSettings {
  autoplay: boolean;
  interval: HeroCarouselInterval;
  transition: HeroTransition;
  transitionDuration: HeroTransitionDuration;
  showIndicators: boolean;
  showArrows: boolean;
  pauseOnHover: boolean;
  loop: boolean;
}

export interface HeroSlideCta {
  text: string;
  url: string;
  openInNewTab?: boolean;
}

/** Contenido textual del slide */
export interface HeroSlideContent {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
}

/** Imagen, overlay y encuadre */
export interface HeroSlideMultimedia {
  desktopMediaId: string;
  mobileMediaId: string;
  imageAlt: string;
  overlay: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  alignment: HeroAlignment;
  customAlignment: string;
}

/** CTAs principales y secundarios */
export interface HeroSlideActions {
  enabled: boolean;
  primary: HeroSlideCta;
  secondary: HeroSlideCta;
}

/** Fuente de datos para la tarjeta flotante del Hero (OT-PORTAL-015) */
export type HeroFloatingCardSource =
  | "manual"
  | "next_academic_event"
  | "featured_notice";

export const HERO_FLOATING_CARD_SOURCE_OPTIONS: Array<{
  value: HeroFloatingCardSource;
  label: string;
}> = [
  { value: "manual", label: "Manual" },
  { value: "next_academic_event", label: "Próximo evento académico" },
  { value: "featured_notice", label: "Aviso institucional destacado" },
];

/** Tarjeta flotante (evento / convocatoria) */
export interface HeroSlideFloatingCard {
  enabled: boolean;
  /** manual = campos del editor; otros = Content Engine */
  source?: HeroFloatingCardSource;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  button: HeroSlideCta;
}

/** Beneficios inferiores del hero */
export interface HeroSlideBenefits {
  enabled: boolean;
  items: HeroFeature[];
}

/** Video institucional (contenido administrable; render congelado en código) */
export interface HeroSlideInstitutionalVideo {
  enabled: boolean;
  mediaId: string;
  url: string;
  posterMediaId: string;
}

export interface HeroStatItem {
  id: string;
  value: string;
  label: string;
}

/** Estadísticas del slide */
export interface HeroSlideStatistics {
  enabled: boolean;
  items: HeroStatItem[];
}

/** SEO por slide (meta cuando el slide es portada) */
export interface HeroSlideSeo {
  title: string;
  description: string;
  imageMediaId: string;
}

/** Estado de publicación */
export interface HeroSlidePublication {
  status: HeroPublicationStatus;
}

/** Ventana de visibilidad (ISO 8601 o YYYY-MM-DD) */
export interface HeroSlideScheduling {
  showFrom: string;
  showUntil: string;
}

/**
 * Slide del constructor Hero — bloque completamente configurable.
 * El diseño visual permanece en código; todo el contenido vive aquí.
 */
export interface HeroSlide {
  id: string;
  order: number;
  priority: HeroSlidePriority;
  content: HeroSlideContent;
  multimedia: HeroSlideMultimedia;
  actions: HeroSlideActions;
  floatingCard: HeroSlideFloatingCard;
  benefits: HeroSlideBenefits;
  institutionalVideo: HeroSlideInstitutionalVideo;
  statistics: HeroSlideStatistics;
  seo: HeroSlideSeo;
  publication: HeroSlidePublication;
  scheduling: HeroSlideScheduling;
}

/** Versión del módulo heroPortal en cms_config.modules (OT-CORE-HERO-002) */
export const HERO_PORTAL_MODULE_VERSION = 2 as const;

export interface HeroPortalConfig {
  enabled: boolean;
  type: HeroPortalType;
  carousel: HeroCarouselSettings;
  /** Contexto de uso para reutilización multi-landing */
  context: HeroPlacementContext;
  slides: HeroSlide[];
}

export interface ResolvedHeroSlide extends HeroSlide {
  imagenDesktopUrl?: string;
  imagenMobileUrl?: string;
}

export const HERO_SLIDE_MAX = 5;

export const HERO_ALIGNMENT_OPTIONS: Array<{ value: HeroAlignment; label: string }> = [
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
  { value: "left", label: "Izquierda" },
  { value: "top", label: "Superior" },
  { value: "bottom", label: "Inferior" },
  { value: "custom", label: "Personalizado" },
];

export const HERO_PUBLICATION_STATUS_OPTIONS: Array<{
  value: HeroPublicationStatus;
  label: string;
}> = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "scheduled", label: "Programado" },
  { value: "archived", label: "Archivado" },
];

export const HERO_SLIDE_PRIORITY_OPTIONS: Array<{
  value: HeroSlidePriority;
  label: string;
}> = [
  { value: "principal", label: "Principal" },
  { value: "featured", label: "Destacado" },
  { value: "normal", label: "Normal" },
];

export const HERO_PLACEMENT_CONTEXT_OPTIONS: Array<{
  value: HeroPlacementContext;
  label: string;
}> = [
  { value: "institutional_portal", label: "Portal institucional" },
  { value: "program_landing", label: "Landing de programas" },
  { value: "course_landing", label: "Landing de cursos" },
  { value: "commercial_landing", label: "Landing comercial" },
  { value: "event", label: "Eventos" },
  { value: "campaign", label: "Campañas" },
  { value: "open_day", label: "Open Day" },
];
