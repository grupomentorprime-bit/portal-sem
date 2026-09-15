/**
 * OT-GROWTH-WEB-LANDING-IMPLEMENT-001 — paleta Growth sobre el catálogo existente.
 * No crea motor de bloques: solo orden, nombres humanos y priorización.
 */
import type { BlockType } from "@/types/page";

/** Orden de aparición en la biblioteca del editor (primero = más útil Growth). */
export const GROWTH_BLOCK_PRIORITY: BlockType[] = [
  "hero",
  "text",
  "feature_grid",
  "scholarships",
  "academic_offer",
  "programs",
  "testimonials",
  "cta_premium",
  "experience_form",
  "faq",
  "people",
  "contact_hub",
  "quick_contact",
  "footer_premium",
];

/** Etiquetas humanas para la paleta (el _id técnico no cambia). */
export const GROWTH_BLOCK_LABELS: Partial<Record<BlockType, string>> = {
  hero: "Hero",
  text: "Texto",
  feature_grid: "Beneficios",
  scholarships: "Beneficios y becas",
  academic_offer: "Servicios / cursos",
  programs: "Servicios / cursos",
  testimonials: "Testimonios",
  cta_premium: "CTA",
  experience_form: "Formulario",
  faq: "FAQ",
  people: "Equipo",
  contact_hub: "Contacto",
  quick_contact: "Contacto rápido",
  footer_premium: "Footer",
  presentation: "Presentación",
  gallery: "Galería",
  stats: "Indicadores",
  video: "Video",
  cta: "CTA (anterior)",
  teachers: "Equipo (anterior)",
  contact: "Formulario simple",
};

export function growthBlockSortIndex(type: BlockType): number {
  const index = GROWTH_BLOCK_PRIORITY.indexOf(type);
  return index === -1 ? GROWTH_BLOCK_PRIORITY.length + 100 : index;
}

export function humanBlockLabel(type: BlockType, fallback: string): string {
  return GROWTH_BLOCK_LABELS[type] ?? fallback;
}
