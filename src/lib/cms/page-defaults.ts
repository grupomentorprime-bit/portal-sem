import type { BlockDefinition, BlockType, CmsTemplate, PageBlock } from "@/types/page";
import { createBlockId } from "@/lib/cms/page-utils";
import { blockTypeToDefaultQuery } from "@/lib/content/block-query-defaults";

export const DEFAULT_NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Programas", href: "/programas" },
  { label: "Admisión", href: "/admision" },
  { label: "Biblioteca", href: "/biblioteca" },
  { label: "Noticias", href: "/noticias" },
  { label: "Contacto", href: "/contacto" },
] as const;

export const DEFAULT_BLOCK_DEFINITIONS: BlockDefinition[] = [
  { _id: "hero", name: "Hero Institucional", component: "HeroInstitutional", category: "Portada", enabled: true },
  { _id: "text", name: "Texto", component: "TextSection", category: "Contenido", enabled: true },
  { _id: "presentation", name: "Presentación", component: "InstitutionPresentation", category: "Contenido", enabled: true },
  { _id: "programs", name: "Programas", component: "ProgramsGrid", category: "Académico", enabled: true },
  { _id: "teachers", name: "Equipo", component: "TeachersGrid", category: "Académico", enabled: true },
  { _id: "news", name: "Noticias", component: "NewsGrid", category: "Contenido", enabled: true },
  { _id: "events", name: "Eventos", component: "EventsGrid", category: "Contenido", enabled: true },
  { _id: "library", name: "Biblioteca", component: "LibraryGrid", category: "Académico", enabled: true },
  { _id: "cta", name: "CTA", component: "CTASection", category: "Conversión", enabled: true },
  { _id: "testimonials", name: "Testimonios", component: "Testimonials", category: "Contenido", enabled: true },
  { _id: "gallery", name: "Galería", component: "InstitutionGallery", category: "Medios", enabled: true },
  { _id: "stats", name: "Estadísticas", component: "StatsInstitution", category: "Contenido", enabled: true },
  { _id: "video", name: "Video", component: "VideoSection", category: "Medios", enabled: true },
  { _id: "verse", name: "Versículo", component: "VerseBlock", category: "Contenido", enabled: true },
  { _id: "contact", name: "Formulario", component: "ContactForm", category: "Conversión", enabled: true },
  { _id: "divider", name: "Separador", component: "Divider", category: "Layout", enabled: true },
  { _id: "html", name: "HTML", component: "HtmlBlock", category: "Avanzado", enabled: true, adminOnly: true },
  { _id: "markdown", name: "Markdown", component: "MarkdownBlock", category: "Avanzado", enabled: true, adminOnly: true },
];

export const DEFAULT_SETTINGS: Record<BlockType, Record<string, unknown>> = {
  hero: {
    institutionName: "",
    motto: "",
    heroImage: "",
    heroMediaId: "",
    logoSrc: "",
    logoMediaId: "",
    ctaLabel: "Conoce nuestros programas",
    ctaHref: "/programas",
    overlayOpacity: 75,
    minHeight: "full",
    align: "center",
  },
  text: {
    overline: "",
    title: "",
    body: "",
    align: "left",
  },
  presentation: {
    overline: "Presentación",
    title: "",
    description: "",
    showVerse: true,
    verseText: "",
    verseReference: "",
  },
  programs: {
    overline: "Académico",
    title: "Nuestros programas",
    description: "",
    showButton: true,
    buttonLabel: "Ver todos los programas",
    buttonHref: "/programas",
    query: blockTypeToDefaultQuery("programs"),
  },
  teachers: {
    overline: "Equipo",
    title: "Nuestros formadores",
    description: "",
    query: blockTypeToDefaultQuery("teachers"),
  },
  news: {
    overline: "Actualidad",
    title: "Noticias y eventos",
    description: "",
    showButton: true,
    buttonLabel: "Ver todas las noticias",
    buttonHref: "/noticias",
    query: blockTypeToDefaultQuery("news"),
  },
  events: {
    overline: "",
    title: "Próximos eventos",
    description: "",
    query: blockTypeToDefaultQuery("events"),
  },
  library: {
    overline: "Biblioteca",
    title: "Recursos disponibles",
    description: "",
    query: blockTypeToDefaultQuery("library"),
  },
  cta: {
    title: "",
    description: "",
    primaryLabel: "",
    primaryHref: "",
    secondaryLabel: "",
    secondaryHref: "",
    variant: "primary",
  },
  testimonials: {
    overline: "Testimonios",
    title: "Voces de nuestra comunidad",
    description: "",
    query: blockTypeToDefaultQuery("testimonials"),
  },
  gallery: {
    overline: "Campus",
    title: "Vida en el seminario",
    description: "",
    query: blockTypeToDefaultQuery("gallery"),
  },
  stats: {
    items: [],
  },
  video: {
    title: "",
    description: "",
    videoUrl: "",
    poster: "",
  },
  verse: {
    text: "",
    reference: "",
  },
  contact: {
    title: "Contáctanos",
    description: "",
    showPhone: true,
    showEmail: true,
    showAddress: true,
  },
  divider: {
    variant: "default",
    spacing: "md",
  },
  html: {
    content: "",
  },
  markdown: {
    content: "",
  },
};

export function createDefaultBlock(type: BlockType, order: number): PageBlock {
  return {
    id: createBlockId(type),
    type,
    visible: true,
    order,
    settings: { ...DEFAULT_SETTINGS[type] },
  };
}

export const DEFAULT_TEMPLATES: CmsTemplate[] = [
  {
    _id: "home",
    name: "Home Institucional",
    description: "Plantilla principal del portal",
    template: "institutional",
    enabled: true,
    blocks: [
      { type: "hero" },
      { type: "presentation" },
      { type: "programs" },
      { type: "stats" },
      { type: "testimonials" },
      { type: "news" },
      { type: "cta" },
    ],
  },
  {
    _id: "landing",
    name: "Landing",
    description: "Página de conversión",
    template: "landing",
    enabled: true,
    blocks: [{ type: "hero" }, { type: "text" }, { type: "cta" }],
  },
  {
    _id: "contact",
    name: "Contacto",
    description: "Página de contacto",
    template: "contact",
    enabled: true,
    blocks: [{ type: "text" }, { type: "contact" }],
  },
];

export function blocksFromTemplate(template: CmsTemplate): PageBlock[] {
  return template.blocks.map((entry, index) => {
    const block = createDefaultBlock(entry.type, index);
    if (entry.settings) {
      block.settings = { ...block.settings, ...entry.settings };
    }
    block.id = createBlockId(entry.type);
    return block;
  });
}

export const SEED_HOME_BLOCK_DATA = {
  stats: {
    items: [
      { id: "1", value: "45+", label: "Años de historia" },
      { id: "2", value: "500+", label: "Egresados" },
      { id: "3", value: "30+", label: "Profesores" },
      { id: "4", value: "3", label: "Programas académicos" },
    ],
  },
  cta: {
    title: "¿Sientes el llamado?",
    description: "Descubre el proceso de admisión.",
    primaryLabel: "Solicitar admisión",
    primaryHref: "/admision",
    secondaryLabel: "Contactar",
    secondaryHref: "/contacto",
  },
};
