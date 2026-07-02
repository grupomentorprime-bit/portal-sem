/**
 * OT-ARCH-UX-001 + OT-DESIGN-HOME-001 — Registro UI y dirección de arte v2.
 * @see docs/ui/UI-COMPONENT-STATUS.md
 * @see docs/design/HOME-PREMIUM-v2-ART-DIRECTION.md
 */

export type UiLockStatus = "locked" | "in_development" | "pending" | "planned";

export type UiDesignVersion = "v1" | "v2";

export interface UiComponentLock {
  id: string;
  label: string;
  /** Pregunta emocional / rol narrativo (OT-DESIGN-HOME-001) */
  emotionalRole?: string;
  narrativeOrder?: number;
  dataBlock?: string;
  designVersion: UiDesignVersion;
  coreStylesheet?: string;
  homeStylesheet?: string;
  status: UiLockStatus;
  unlockOt?: string;
  /** OT de implementación v2 sugerida */
  targetOt?: string;
}

export const UI_COMPONENT_LOCKS: UiComponentLock[] = [
  {
    id: "header",
    label: "Header Premium",
    designVersion: "v1",
    coreStylesheet: "src/app/globals.css",
    status: "locked",
    unlockOt: "OT-UNLOCK-HEADER-001",
  },
  {
    id: "hero",
    label: "Hero Premium",
    emotionalRole: "Inspirar",
    narrativeOrder: 1,
    dataBlock: "hero",
    designVersion: "v1",
    coreStylesheet: "src/styles/hero-premium.css",
    homeStylesheet: "src/styles/home-premium/hero-home.css",
    status: "locked",
    unlockOt: "OT-UNLOCK-HERO-001",
  },
  {
    id: "programs",
    label: "Programas",
    emotionalRole: "¿Qué puedes estudiar?",
    narrativeOrder: 2,
    dataBlock: "academic_offer",
    designVersion: "v2",
    homeStylesheet: "src/styles/home-premium/programs-home.css",
    status: "in_development",
    targetOt: "OT-UX-HOME-PROGRAMS-v2",
  },
  {
    id: "why_study",
    label: "Vocación",
    emotionalRole: "¿Por qué hacerlo?",
    narrativeOrder: 3,
    dataBlock: "feature_grid",
    designVersion: "v2",
    homeStylesheet: "src/styles/home-premium/why-study-home.css",
    status: "in_development",
    targetOt: "OT-UX-HOME-VOCATION-v2",
  },
  {
    id: "timeline",
    label: "Ruta Formativa",
    emotionalRole: "¿Cómo será tu crecimiento?",
    narrativeOrder: 4,
    dataBlock: "timeline",
    designVersion: "v2",
    coreStylesheet: "src/styles/timeline.css",
    homeStylesheet: "src/styles/home-premium/timeline-home.css",
    status: "pending",
    targetOt: "OT-UX-HOME-TIMELINE-v2",
  },
  {
    id: "teachers",
    label: "Docentes",
    emotionalRole: "¿Quién te acompañará?",
    narrativeOrder: 5,
    dataBlock: "people",
    designVersion: "v2",
    coreStylesheet: "src/styles/people-grid.css",
    homeStylesheet: "src/styles/home-premium/teachers-home.css",
    status: "in_development",
    targetOt: "OT-UX-HOME-TEACHERS-v2",
  },
  {
    id: "community",
    label: "Comunidad",
    emotionalRole: "Vida, historias, testimonios",
    narrativeOrder: 6,
    designVersion: "v2",
    status: "planned",
    targetOt: "OT-UX-HOME-COMMUNITY-v2",
  },
  {
    id: "news",
    label: "Noticias",
    emotionalRole: "Revista institucional",
    narrativeOrder: 7,
    dataBlock: "news",
    designVersion: "v2",
    coreStylesheet: "src/styles/news-grid.css",
    homeStylesheet: "src/styles/home-premium/news-home.css",
    status: "pending",
    targetOt: "OT-UX-HOME-NEWS-v2",
  },
  {
    id: "cta",
    label: "CTA Premium",
    emotionalRole: "Cierre emocional",
    narrativeOrder: 8,
    dataBlock: "cta_premium",
    designVersion: "v2",
    coreStylesheet: "src/styles/cta-premium.css",
    homeStylesheet: "src/styles/home-premium/cta-home.css",
    status: "pending",
    targetOt: "OT-UX-HOME-CTA-v2",
  },
  {
    id: "contact",
    label: "Contacto",
    emotionalRole: "Cercanía institucional",
    narrativeOrder: 9,
    dataBlock: "contact_hub",
    designVersion: "v2",
    coreStylesheet: "src/styles/contact-hub.css",
    homeStylesheet: "src/styles/home-premium/contact-home.css",
    status: "pending",
    targetOt: "OT-UX-HOME-CONTACT-v2",
  },
  {
    id: "footer",
    label: "Footer Premium",
    designVersion: "v2",
    coreStylesheet: "src/styles/footer-premium.css",
    homeStylesheet: "src/styles/home-premium/footer-home.css",
    status: "in_development",
    targetOt: "OT-PORTAL-002",
  },
];

export function isComponentLocked(id: string): boolean {
  return UI_COMPONENT_LOCKS.find((c) => c.id === id)?.status === "locked";
}

export function getLockedComponents(): UiComponentLock[] {
  return UI_COMPONENT_LOCKS.filter((c) => c.status === "locked");
}

export function getHomeNarrative(): UiComponentLock[] {
  return [...UI_COMPONENT_LOCKS]
    .filter((c) => c.narrativeOrder != null)
    .sort((a, b) => (a.narrativeOrder ?? 0) - (b.narrativeOrder ?? 0));
}

/** Ruta canónica del documento de dirección de arte v2 */
export const HOME_ART_DIRECTION_DOC =
  "docs/design/HOME-PREMIUM-v2-ART-DIRECTION.md";
