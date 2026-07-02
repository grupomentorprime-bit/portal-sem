import type { BlockType } from "@/types/page";

/** Metadatos de experiencia por sección — OT-PORTAL-001 Home narrativo */
export type HomeSectionSurface =
  | "hero"
  | "white"
  | "soft"
  | "gradient"
  | "institutional"
  | "cta";

export interface HomeSectionExperience {
  feeling: string;
  action: string;
  surface: HomeSectionSurface;
  paddingY: number;
}

export const HOME_SECTION_EXPERIENCE: Partial<Record<BlockType, HomeSectionExperience>> = {
  hero: {
    feeling: "Inspiración",
    action: "Explorar",
    surface: "hero",
    paddingY: 0,
  },
  academic_offer: {
    feeling: "Descubrimiento",
    action: "Ver programas",
    surface: "soft",
    paddingY: 120,
  },
  seminarios_home: {
    feeling: "Profundización",
    action: "Inscribirse",
    surface: "white",
    paddingY: 120,
  },
  audience_profiles: {
    feeling: "Identificación",
    action: "Reconocerse",
    surface: "institutional",
    paddingY: 140,
  },
  modality: {
    feeling: "Claridad",
    action: "Entender cómo se estudia",
    surface: "white",
    paddingY: 150,
  },
  people: {
    feeling: "Confianza",
    action: "Conocer docentes",
    surface: "gradient",
    paddingY: 160,
  },
  testimonials: {
    feeling: "Prueba social",
    action: "Confiar",
    surface: "white",
    paddingY: 140,
  },
  admission_process: {
    feeling: "Seguridad",
    action: "Postular",
    surface: "soft",
    paddingY: 150,
  },
  faq: {
    feeling: "Resolución",
    action: "Resolver dudas",
    surface: "white",
    paddingY: 80,
  },
  cta_premium: {
    feeling: "Decisión",
    action: "Postular",
    surface: "cta",
    paddingY: 180,
  },
};

const DEFAULT_EXPERIENCE: HomeSectionExperience = {
  feeling: "Continuidad",
  action: "Explorar",
  surface: "white",
  paddingY: 120,
};

export function getHomeSectionExperience(blockType: BlockType): HomeSectionExperience {
  return HOME_SECTION_EXPERIENCE[blockType] ?? DEFAULT_EXPERIENCE;
}

export function isHomePageSlug(slug: string): boolean {
  return slug === "/" || slug === "home" || slug === "";
}

/** Orden canónico Home Premium — OT-PORTAL-001 */
export const HOME_PREMIUM_BLOCK_ORDER: BlockType[] = [
  "hero",
  "academic_offer",
  "audience_profiles",
  "modality",
  "people",
  "testimonials",
  "admission_process",
  "faq",
  "cta_premium",
];
