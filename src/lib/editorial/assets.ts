/**
 * OT-EDITORIAL-ASSETS-001 — Catálogo tipado de recursos editoriales SEM.
 * Multi-tenant: rutas estáticas; colores heredan --sem-* del tenant activo.
 */

export const EDITORIAL_BASE = "/editorial" as const;

export const editorialPaths = {
  patterns: {
    bibleLines: `${EDITORIAL_BASE}/patterns/bible-lines.svg`,
    bibleMargin: `${EDITORIAL_BASE}/patterns/bible-margin.svg`,
    columnClassical: `${EDITORIAL_BASE}/patterns/column-classical.svg`,
    isotypeGeometry: `${EDITORIAL_BASE}/patterns/isotype-geometry.svg`,
    editorialLines: `${EDITORIAL_BASE}/patterns/editorial-lines.svg`,
    academicGrid: `${EDITORIAL_BASE}/patterns/academic-grid.svg`,
    crossMinimal: `${EDITORIAL_BASE}/patterns/cross-minimal.svg`,
    scriptureDots: `${EDITORIAL_BASE}/patterns/scripture-dots.svg`,
    semDiamond: `${EDITORIAL_BASE}/patterns/sem-diamond.svg`,
    pageRhythm: `${EDITORIAL_BASE}/patterns/page-rhythm.svg`,
    marginNotes: `${EDITORIAL_BASE}/patterns/margin-notes.svg`,
    chapterMark: `${EDITORIAL_BASE}/patterns/chapter-mark.svg`,
    studyGrid: `${EDITORIAL_BASE}/patterns/study-grid.svg`,
    pillarFlute: `${EDITORIAL_BASE}/patterns/pillar-flute.svg`,
    wovenLines: `${EDITORIAL_BASE}/patterns/woven-lines.svg`,
  },
  textures: {
    paperEditorial: `${EDITORIAL_BASE}/textures/paper-editorial.svg`,
    parchmentModern: `${EDITORIAL_BASE}/textures/parchment-modern.svg`,
    canvasSoft: `${EDITORIAL_BASE}/textures/canvas-soft.svg`,
    paperFiber: `${EDITORIAL_BASE}/textures/paper-fiber.svg`,
    fineGrain: `${EDITORIAL_BASE}/textures/fine-grain.svg`,
    linenWeave: `${EDITORIAL_BASE}/textures/linen-weave.svg`,
    vellumSoft: `${EDITORIAL_BASE}/textures/vellum-soft.svg`,
    cottonMatte: `${EDITORIAL_BASE}/textures/cotton-matte.svg`,
    warmPaper: `${EDITORIAL_BASE}/textures/warm-paper.svg`,
    editorialMatte: `${EDITORIAL_BASE}/textures/editorial-matte.svg`,
  },
  gradients: {
    vertical: `${EDITORIAL_BASE}/gradients/institutional-vertical.svg`,
    diagonal: `${EDITORIAL_BASE}/gradients/institutional-diagonal.svg`,
    hero: `${EDITORIAL_BASE}/gradients/institutional-hero.svg`,
    cta: `${EDITORIAL_BASE}/gradients/institutional-cta.svg`,
    footer: `${EDITORIAL_BASE}/gradients/institutional-footer.svg`,
  },
  overlays: {
    editorialBlue: `${EDITORIAL_BASE}/overlays/overlay-editorial-blue.svg`,
    darkBlue: `${EDITORIAL_BASE}/overlays/overlay-dark-blue.svg`,
    diagonal: `${EDITORIAL_BASE}/overlays/overlay-diagonal.svg`,
    hero: `${EDITORIAL_BASE}/overlays/overlay-hero.svg`,
    cta: `${EDITORIAL_BASE}/overlays/overlay-cta.svg`,
    footer: `${EDITORIAL_BASE}/overlays/overlay-footer.svg`,
  },
  dividers: {
    editorialLine: `${EDITORIAL_BASE}/dividers/divider-editorial-line.svg`,
    cross: `${EDITORIAL_BASE}/dividers/divider-cross.svg`,
    academic: `${EDITORIAL_BASE}/dividers/divider-academic.svg`,
    biblical: `${EDITORIAL_BASE}/dividers/divider-biblical.svg`,
    isotype: `${EDITORIAL_BASE}/dividers/divider-isotype.svg`,
  },
  seals: {
    respaldoInstitucional: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-respaldo-institucional-${variant}.svg`,
    cienOnline: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-cien-online-${variant}.svg`,
    comunidadFormativa: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-comunidad-formativa-${variant}.svg`,
    formacionBiblica: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-formacion-biblica-${variant}.svg`,
    campusVirtual: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-campus-virtual-${variant}.svg`,
    ipnChile: (variant: "blue" | "white" | "warm") =>
      `${EDITORIAL_BASE}/seals/seal-ipn-chile-${variant}.svg`,
  },
  icons: {
    bible: `${EDITORIAL_BASE}/icons/bible.svg`,
    discipleship: `${EDITORIAL_BASE}/icons/discipleship.svg`,
    ministry: `${EDITORIAL_BASE}/icons/ministry.svg`,
    church: `${EDITORIAL_BASE}/icons/church.svg`,
    community: `${EDITORIAL_BASE}/icons/community.svg`,
    service: `${EDITORIAL_BASE}/icons/service.svg`,
    leadership: `${EDITORIAL_BASE}/icons/leadership.svg`,
    prayer: `${EDITORIAL_BASE}/icons/prayer.svg`,
    study: `${EDITORIAL_BASE}/icons/study.svg`,
    vocation: `${EDITORIAL_BASE}/icons/vocation.svg`,
  },
  backgrounds: {
    hero: `${EDITORIAL_BASE}/backgrounds/bg-hero.svg`,
    programas: `${EDITORIAL_BASE}/backgrounds/bg-programas.svg`,
    equipo: `${EDITORIAL_BASE}/backgrounds/bg-equipo.svg`,
    biblioteca: `${EDITORIAL_BASE}/backgrounds/bg-biblioteca.svg`,
    noticias: `${EDITORIAL_BASE}/backgrounds/bg-noticias.svg`,
    footer: `${EDITORIAL_BASE}/backgrounds/bg-footer.svg`,
  },
  illustrations: {
    bibleOpen: `${EDITORIAL_BASE}/illustrations/bible-open.svg`,
    community: `${EDITORIAL_BASE}/illustrations/community.svg`,
    study: `${EDITORIAL_BASE}/illustrations/study.svg`,
    prayer: `${EDITORIAL_BASE}/illustrations/prayer.svg`,
    virtualClassroom: `${EDITORIAL_BASE}/illustrations/virtual-classroom.svg`,
    library: `${EDITORIAL_BASE}/illustrations/library.svg`,
  },
} as const;

export type EditorialSealVariant = "blue" | "white" | "warm";

/** Variante «warm» usa --sem-light como acento cálido institucional (no oro metálico). */
export const EDITORIAL_SEAL_VARIANTS: EditorialSealVariant[] = ["blue", "white", "warm"];
