import type { BlockType } from "@/types/page";
import type { PortalBlockDefinition } from "@/types/portal";

/** Catálogo oficial de bloques del Portal Engine */
export const PORTAL_BLOCK_REGISTRY: PortalBlockDefinition[] = [
  { type: "hero", version: 1, name: "Hero", category: "Portada", component: "HeroBlockSection" },
  { type: "text", version: 1, name: "Texto", category: "Contenido", component: "TextSection" },
  { type: "presentation", version: 1, name: "Presentación", category: "Contenido", component: "PresentationBlockSection" },
  { type: "feature_grid", version: 1, name: "Feature Grid", category: "Experiencia", component: "FeatureGridBlockSection" },
  { type: "audience_profiles", version: 1, name: "Perfil postulante", category: "Conversión", component: "AudienceProfilesBlockSection" },
  { type: "modality", version: 1, name: "Modalidad", category: "Contenido", component: "ModalityBlockSection" },
  { type: "programs", version: 1, name: "Programas", category: "Académico", component: "ProgramsSection", resolver: "programs", queryDriven: true },
  { type: "academic_offer", version: 1, name: "Oferta Académica", category: "Académico", component: "AcademicOfferBlockSection", resolver: "programs", queryDriven: true },
  { type: "seminarios_home", version: 1, name: "Seminarios Home", category: "Académico", component: "SeminariosHomeBlockSection" },
  { type: "teachers", version: 1, name: "Equipo (legacy)", category: "Académico", component: "TeachersSection", resolver: "team", queryDriven: true },
  { type: "people", version: 1, name: "People Grid", category: "Experiencia", component: "PeopleBlockSection", resolver: "people", queryDriven: true },
  { type: "news", version: 1, name: "Noticias", category: "Experiencia", component: "NewsBlockSection", resolver: "news", queryDriven: true },
  { type: "events", version: 1, name: "Eventos", category: "Contenido", component: "EventsBlockSection", resolver: "events", queryDriven: true },
  { type: "library", version: 1, name: "Biblioteca", category: "Académico", component: "LibraryBlockSection", resolver: "library", queryDriven: true },
  { type: "resources", version: 1, name: "Recursos", category: "Académico", component: "ResourcesBlockSection" },
  { type: "cta", version: 1, name: "CTA (legacy)", category: "Conversión", component: "CtaBlockSection" },
  { type: "cta_premium", version: 1, name: "CTA Premium", category: "Experiencia", component: "CtaPremiumBlockSection" },
  { type: "testimonials", version: 1, name: "Testimonios", category: "Contenido", component: "TestimonialsBlockSection", resolver: "testimonials", queryDriven: true },
  { type: "gallery", version: 1, name: "Galería", category: "Medios", component: "GalleryBlockSection", resolver: "gallery", queryDriven: true },
  { type: "stats", version: 1, name: "Estadísticas", category: "Contenido", component: "StatsBlockSection", resolver: "stats" },
  { type: "video", version: 1, name: "Video", category: "Medios", component: "VideoSection" },
  { type: "verse", version: 1, name: "Versículo", category: "Contenido", component: "VerseBlockSection" },
  { type: "contact", version: 1, name: "Formulario", category: "Conversión", component: "ContactForm" },
  { type: "admission_process", version: 1, name: "Proceso admisión", category: "Conversión", component: "AdmissionProcessBlockSection" },
  { type: "timeline", version: 1, name: "Timeline", category: "Experiencia", component: "TimelineBlockSection" },
  { type: "scholarships", version: 1, name: "Becas", category: "Conversión", component: "ScholarshipsBlockSection" },
  { type: "faq", version: 1, name: "FAQ", category: "Conversión", component: "FaqBlockSection" },
  { type: "quick_contact", version: 1, name: "Contacto rápido", category: "Conversión", component: "QuickContactBlockSection" },
  { type: "contact_hub", version: 1, name: "Contact Hub", category: "Experiencia", component: "ContactHubBlockSection" },
  { type: "experience_form", version: 1, name: "Experience Form", category: "Experiencia", component: "ExperienceFormBlockSection" },
  { type: "footer_premium", version: 1, name: "Footer Premium", category: "Layout", component: "FooterPremiumBlockSection" },
  { type: "alliance", version: 1, name: "Alianza", category: "Contenido", component: "AllianceBlockSection" },
  { type: "divider", version: 1, name: "Separador", category: "Layout", component: "Divider" },
  { type: "html", version: 1, name: "HTML", category: "Avanzado", component: "HtmlBlock", adminOnly: true },
  { type: "markdown", version: 1, name: "Markdown", category: "Avanzado", component: "MarkdownBlock", adminOnly: true },
];

const registryMap = new Map<BlockType, PortalBlockDefinition>(
  PORTAL_BLOCK_REGISTRY.map((d) => [d.type, d])
);

export function getBlockDefinition(type: BlockType): PortalBlockDefinition | undefined {
  return registryMap.get(type);
}

export function isRegisteredBlockType(type: string): type is BlockType {
  return registryMap.has(type as BlockType);
}

export function listBlockDefinitions(): PortalBlockDefinition[] {
  return [...PORTAL_BLOCK_REGISTRY];
}
