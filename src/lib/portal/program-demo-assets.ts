/**
 * OT-DESIGN-PROGRAMS-003 — Fotografías demo: seminario online (temporales).
 * Reemplazar archivos en public/images/demo/programs/ sin cambiar rutas.
 */

export const PROGRAM_DEMO_IMAGES = {
  /** G-2023 — Pastores y pastoras (clase online) */
  onlinePastoral: "/images/demo/programs/online-pastoral.jpg",
  /** G-2024 — Pastores y líderes (formación digital) */
  onlinePastors: "/images/demo/programs/online-pastors.jpg",
  /** G-2025 — Hermanos(as) y líderes (aula virtual) */
  onlineBrothers: "/images/demo/programs/online-brothers.jpg",
  /** G-2026 — Admisión / comunidad online */
  onlineAdmission: "/images/demo/programs/online-admission.jpg",
  /** Hero editorial — estudiante en modalidad online */
  heroOnline: "/images/demo/programs/hero-online.jpg",
} as const;

export const PROGRAM_CARD_FALLBACKS = [
  PROGRAM_DEMO_IMAGES.onlinePastoral,
  PROGRAM_DEMO_IMAGES.onlinePastors,
  PROGRAM_DEMO_IMAGES.onlineBrothers,
  PROGRAM_DEMO_IMAGES.onlineAdmission,
] as const;

export const PROGRAM_HERO_GALLERY_FALLBACKS = [
  PROGRAM_DEMO_IMAGES.heroOnline,
  PROGRAM_DEMO_IMAGES.onlinePastoral,
  PROGRAM_DEMO_IMAGES.onlineBrothers,
] as const;

/** Isotipo blanco oficial — marca de agua en fotografías y footer oscuro */
export const SEM_PROGRAM_ISOTYPE = "/images/logo-sem-isotype-white.png";

/** @deprecated Usar SEM_PROGRAM_ISOTYPE */
export const SEM_PROGRAM_WATERMARK = SEM_PROGRAM_ISOTYPE;
