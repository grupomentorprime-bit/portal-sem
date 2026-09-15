/**
 * OT-GROWTH-WEB-LANDING-IMPLEMENT-001 — objetivos de página (UX).
 * Tipos = plantillas existentes; un solo editor (Experience Studio).
 */
import { createDefaultBlock } from "@/lib/cms/page-defaults";
import { normalizeSlug } from "@/lib/cms/page-utils";
import type { BlockType, PageBlock, PageTemplate } from "@/types/page";

export type PageObjectiveId =
  | "normal"
  | "landing"
  | "service"
  | "contact";

export interface PageObjectiveOption {
  id: PageObjectiveId;
  label: string;
  description: string;
  /** Plantilla CmsPage.template */
  template: PageTemplate;
  /** _id preferido en DEFAULT_TEMPLATES / cms_templates */
  preferredTemplateId: string;
  seedBlockTypes: BlockType[];
}

export const PAGE_OBJECTIVES: PageObjectiveOption[] = [
  {
    id: "normal",
    label: "Página normal",
    description: "Contenido institucional o informativo del sitio.",
    template: "institutional",
    preferredTemplateId: "institutional",
    seedBlockTypes: ["hero", "text", "feature_grid", "cta_premium", "footer_premium"],
  },
  {
    id: "landing",
    label: "Landing de captación",
    description: "Página para atraer interesados y recibir consultas.",
    template: "landing",
    preferredTemplateId: "landing",
    seedBlockTypes: [
      "hero",
      "feature_grid",
      "faq",
      "experience_form",
      "cta_premium",
      "footer_premium",
    ],
  },
  {
    id: "service",
    label: "Página de servicio o curso",
    description: "Presenta una oferta con beneficios, testimonios y llamada a la acción.",
    template: "program",
    preferredTemplateId: "program",
    seedBlockTypes: [
      "hero",
      "academic_offer",
      "feature_grid",
      "testimonials",
      "experience_form",
      "cta_premium",
      "footer_premium",
    ],
  },
  {
    id: "contact",
    label: "Contacto",
    description: "Datos de contacto y formulario para mensajes.",
    template: "contact",
    preferredTemplateId: "contact",
    seedBlockTypes: ["text", "contact_hub", "experience_form", "footer_premium"],
  },
];

export function getPageObjective(id: string): PageObjectiveOption | undefined {
  return PAGE_OBJECTIVES.find((item) => item.id === id);
}

export function objectiveLabelForTemplate(template: PageTemplate): string {
  const match = PAGE_OBJECTIVES.find((item) => item.template === template);
  return match?.label ?? "Página";
}

/** Identificador interno a partir del nombre (sin exponerlo como campo técnico al usuario). */
export function pageIdFromTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `pagina-${Date.now().toString(36)}`;
}

export function pathFromTitle(title: string): string {
  return normalizeSlug(pageIdFromTitle(title));
}

export function seedBlocksForObjective(objective: PageObjectiveOption): PageBlock[] {
  return objective.seedBlockTypes.map((type, index) => createDefaultBlock(type, index));
}
