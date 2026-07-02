/**
 * OT-CMSV2-BUILD-001A — Component Registry del Experience Studio.
 * Ningún componente del builder existe fuera de este registro.
 */
import { DEFAULT_BLOCK_DEFINITIONS } from "@/lib/cms/page-defaults";
import { getBlockSchema, listBlockSchemas } from "./schema/definitions";
import type { BlockSchema } from "./schema/types";
import type { BlockDefinition, BlockType } from "@/types/page";

export const STUDIO_CATEGORIES = [
  { id: "hero", label: "Hero" },
  { id: "content", label: "Contenido" },
  { id: "programs", label: "Programas" },
  { id: "news", label: "Noticias" },
  { id: "team", label: "Equipo" },
  { id: "library", label: "Biblioteca" },
  { id: "cta", label: "CTA" },
  { id: "faq", label: "FAQ" },
  { id: "timeline", label: "Timeline" },
  { id: "cards", label: "Cards" },
  { id: "gallery", label: "Galería" },
  { id: "form", label: "Formulario" },
  { id: "video", label: "Video" },
  { id: "testimonials", label: "Testimonio" },
  { id: "indicators", label: "Indicadores" },
  { id: "footer", label: "Footer" },
  { id: "conversion", label: "Conversión" },
  { id: "experience", label: "Experiencia" },
  { id: "layout", label: "Layout" },
] as const;

const CATEGORY_BY_BLOCK: Partial<Record<BlockType, string>> = {
  hero: "hero",
  text: "content",
  presentation: "content",
  modality: "content",
  alliance: "content",
  verse: "content",
  testimonials: "testimonials",
  gallery: "gallery",
  video: "video",
  stats: "indicators",
  programs: "programs",
  academic_offer: "programs",
  seminarios_home: "programs",
  teachers: "team",
  people: "team",
  news: "news",
  events: "news",
  library: "library",
  resources: "library",
  cta: "cta",
  cta_premium: "cta",
  faq: "faq",
  timeline: "timeline",
  admission_process: "timeline",
  feature_grid: "cards",
  audience_profiles: "cards",
  contact: "form",
  quick_contact: "form",
  experience_form: "form",
  contact_hub: "form",
  scholarships: "conversion",
  footer_premium: "footer",
  divider: "layout",
  academic_agenda: "experience",
  institutional_notices: "experience",
};

export interface StudioComponentEntry {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  category: string;
  categoryLabel: string;
  enabled: boolean;
  adminOnly?: boolean;
  schema?: BlockSchema;
  definition: BlockDefinition;
}

function categoryLabel(categoryId: string): string {
  return STUDIO_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function buildComponentRegistry(
  library: BlockDefinition[] = DEFAULT_BLOCK_DEFINITIONS
): StudioComponentEntry[] {
  return library
    .filter((def) => def.enabled)
    .map((def) => {
      const schema = getBlockSchema(def._id);
      const category = schema?.category ?? CATEGORY_BY_BLOCK[def._id] ?? "content";
      return {
        type: def._id,
        name: def.name,
        description: schema?.description ?? `Componente ${def.name}`,
        icon: schema?.icon ?? "Circle",
        category,
        categoryLabel: categoryLabel(category),
        enabled: def.enabled,
        adminOnly: def.adminOnly,
        schema,
        definition: def,
      };
    });
}

export function getStudioComponent(
  type: BlockType,
  library?: BlockDefinition[]
): StudioComponentEntry | undefined {
  return buildComponentRegistry(library).find((entry) => entry.type === type);
}

export function listStudioCategories(entries: StudioComponentEntry[]) {
  const ids = [...new Set(entries.map((e) => e.category))];
  return STUDIO_CATEGORIES.filter((c) => ids.includes(c.id));
}

export { listBlockSchemas, getBlockSchema };
