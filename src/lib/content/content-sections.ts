import type { AllowedCollection } from "@/lib/content/types";

export type ContentEditorType = "content" | "person" | "category";

export type AcademicCatalogKind = "programs" | "courses";

export interface ContentSectionMeta {
  slug: string;
  collection: AllowedCollection;
  title: string;
  description: string;
  href: string;
  editor: ContentEditorType;
  /** Subconjunto de academy_programs — programas de largo plazo vs cursos cortos */
  catalogKind?: AcademicCatalogKind;
}

export const CONTENT_SECTIONS: Record<string, ContentSectionMeta> = {
  programs: {
    slug: "programs",
    collection: "academy_programs",
    title: "Programas",
    description: "Programas formativos de la institución (diplomas, certificados, especializaciones)",
    href: "/admin/content/programs",
    editor: "content",
    catalogKind: "programs",
  },
  courses: {
    slug: "courses",
    collection: "academy_programs",
    title: "Cursos",
    description: "Cursos formativos cortos del seminario",
    href: "/admin/content/courses",
    editor: "content",
    catalogKind: "courses",
  },
  news: {
    slug: "news",
    collection: "content_news",
    title: "Noticias",
    description: "Noticias institucionales",
    href: "/admin/content/news",
    editor: "content",
  },
  people: {
    slug: "people",
    collection: "content_people",
    title: "Personas",
    description: "Equipo directivo, docente y técnico del seminario",
    href: "/admin/content/people",
    editor: "person",
  },
  team: {
    slug: "team",
    collection: "academy_team",
    title: "Equipo (legacy)",
    description: "Colección heredada — preferir Personas (content_people)",
    href: "/admin/content/team",
    editor: "content",
  },
  library: {
    slug: "library",
    collection: "content_library",
    title: "Biblioteca",
    description: "Recursos bibliográficos",
    href: "/admin/content/library",
    editor: "content",
  },
  events: {
    slug: "events",
    collection: "content_events",
    title: "Eventos",
    description: "Eventos institucionales",
    href: "/admin/content/events",
    editor: "content",
  },
  "academic-agenda": {
    slug: "academic-agenda",
    collection: "content_academic_agenda",
    title: "Agenda Académica",
    description: "Calendario oficial de hitos académicos",
    href: "/admin/content/academic-agenda",
    editor: "content",
  },
  avisos: {
    slug: "avisos",
    collection: "content_institutional_notices",
    title: "Avisos Institucionales",
    description: "Comunicados oficiales de la Dirección",
    href: "/admin/content/avisos",
    editor: "content",
  },
  testimonials: {
    slug: "testimonials",
    collection: "academy_testimonials",
    title: "Testimonios",
    description: "Testimonios de la comunidad",
    href: "/admin/content/testimonials",
    editor: "content",
  },
  gallery: {
    slug: "gallery",
    collection: "academy_gallery",
    title: "Galería",
    description: "Imágenes institucionales",
    href: "/admin/content/gallery",
    editor: "content",
  },
  categories: {
    slug: "categories",
    collection: "academy_categories",
    title: "Categorías",
    description: "Categorías académicas",
    href: "/admin/content/categories",
    editor: "category",
  },
};

export const EDITABLE_COLLECTIONS: AllowedCollection[] = [
  "academy_programs",
  "content_news",
  "content_events",
  "content_library",
  "content_academic_agenda",
  "content_institutional_notices",
  "content_people",
  "academy_testimonials",
  "academy_gallery",
  "academy_categories",
];

export function isEditableCollection(collection: string): collection is AllowedCollection {
  return EDITABLE_COLLECTIONS.includes(collection as AllowedCollection);
}

export function getSectionBySlug(slug: string): ContentSectionMeta | undefined {
  return CONTENT_SECTIONS[slug];
}

export function getSectionByCollection(collection: string): ContentSectionMeta | undefined {
  return Object.values(CONTENT_SECTIONS).find((s) => s.collection === collection);
}
