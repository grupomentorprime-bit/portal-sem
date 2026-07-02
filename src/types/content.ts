/** Modelos compartidos — reutilizables en Web, Campus y Expo */

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface SeoData {
  title: string;
  description: string;
  keywords: string[];
}

export interface ContentDocument {
  _id: string;
  tenant: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  /** @deprecated Usar imageMediaId / coverMediaId / featuredMediaId / photoMediaId */
  image: string;
  imageMediaId?: string;
  coverMediaId?: string;
  featuredMediaId?: string;
  photoMediaId?: string;
  galleryMediaIds?: string[];
  /** URLs resueltas en runtime — no persistir */
  galleryUrls?: string[];
  status: ContentStatus;
  featured: boolean;
  categories: string[];
  tags: string[];
  seo: SeoData;
  publishedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
  /** Campos extendidos por tipo de contenido */
  duration?: string;
  icon?: string;
  href?: string;
  name?: string;
  role?: string;
  specialty?: string;
  quote?: string;
  author?: string;
  excerpt?: string;
  date?: string;
  category?: string;
  location?: string;
  alt?: string;
  /** @deprecated Usar srcMediaId */
  src?: string;
  srcMediaId?: string;
  modality?: string;
  requirements?: string;
  fees?: string;
  modules?: string;
  programStatus?: "active" | "admission_open" | "coming_soon";
  /** Etiqueta visible en tarjeta (Nuevo, Destacado, etc.) */
  badge?: string;
  certification?: string;
  showPrice?: boolean;
  startDate?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  /** Personas — tipo (teacher, authority, speaker, etc.) */
  personRole?: string;
  /** Personas — estado editorial */
  personStatus?: "active" | "featured" | "guest" | "historical";
  email?: string;
  phone?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  visible?: boolean;
  /** Testimonios — programa del egresado */
  program?: string;
  rating?: number;
  /** Eventos — hora de inicio */
  time?: string;
  /** Biblioteca / recursos — tipo de material */
  resourceType?: string;
  department?: string;
  /** Agenda académica — fecha término (ISO) */
  endDate?: string;
  /** Agenda académica — color de categoría (hex) */
  color?: string;
  /** Agenda académica / avisos — ventana de visibilidad */
  visibleFrom?: string;
  visibleUntil?: string;
  /** Avisos institucionales — prioridad editorial (mayor = más visible) */
  priority?: number;
  /** Avisos institucionales — archivo adjunto */
  attachmentMediaId?: string;
}

export interface CategoryItem {
  _id: string;
  tenant: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Modelos de tarjeta para UI — Web y Mobile comparten forma */
export type ProgramStatus = "active" | "admission_open" | "coming_soon";

export const PROGRAM_MODALITY_OPTIONS = [
  { value: "Online 100%", label: "Online 100%" },
  { value: "Presencial", label: "Presencial" },
  { value: "Híbrido", label: "Híbrido" },
] as const;

export function programModalityOptions(
  current?: string
): Array<{ value: string; label: string }> {
  const trimmed = current?.trim();
  if (trimmed && !PROGRAM_MODALITY_OPTIONS.some((option) => option.value === trimmed)) {
    return [{ value: trimmed, label: trimmed }, ...PROGRAM_MODALITY_OPTIONS];
  }
  return [...PROGRAM_MODALITY_OPTIONS];
}

export const PROGRAM_AUDIENCE_OPTIONS = [
  { value: "Pastores y pastoras", label: "Pastores y pastoras" },
  { value: "Pastores y Líderes", label: "Pastores y Líderes" },
  { value: "Hermanos(as) y Líderes", label: "Hermanos(as) y Líderes" },
  { value: "Líderes", label: "Líderes" },
  { value: "Nuevos estudiantes", label: "Nuevos estudiantes" },
] as const;

export function programAudienceOptions(
  current?: string
): Array<{ value: string; label: string }> {
  const trimmed = current?.trim();
  if (trimmed && !PROGRAM_AUDIENCE_OPTIONS.some((option) => option.value === trimmed)) {
    return [{ value: trimmed, label: trimmed }, ...PROGRAM_AUDIENCE_OPTIONS];
  }
  return [...PROGRAM_AUDIENCE_OPTIONS];
}

export const PROGRAM_ICON_OPTIONS = [
  { value: "BookOpen", label: "Formación bíblica" },
  { value: "Users", label: "Pastores y comunidad" },
  { value: "GraduationCap", label: "Graduación" },
  { value: "Monitor", label: "Modalidad online" },
  { value: "Heart", label: "Pastoral" },
  { value: "Library", label: "Biblioteca" },
  { value: "Award", label: "Certificación" },
  { value: "Compass", label: "Orientación ministerial" },
  { value: "Sparkles", label: "Nuevo ingreso" },
  { value: "Calendar", label: "Calendario académico" },
  { value: "Video", label: "Clases en línea" },
  { value: "Shield", label: "Institucional" },
] as const;

export function programIconOptions(
  current?: string
): Array<{ value: string; label: string }> {
  const trimmed = current?.trim();
  if (trimmed && !PROGRAM_ICON_OPTIONS.some((option) => option.value === trimmed)) {
    return [{ value: trimmed, label: `${trimmed} (personalizado)` }, ...PROGRAM_ICON_OPTIONS];
  }
  return [...PROGRAM_ICON_OPTIONS];
}

export interface ProgramItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  href: string;
  image?: string;
  category?: string;
  categories?: string[];
  color?: string;
  modality?: string;
  status?: ProgramStatus;
  badge?: string;
  featured?: boolean;
  certification?: string;
  price?: string;
  showPrice?: boolean;
  /** Matrícula de ingreso */
  enrollmentFee?: string;
  /** Valor de mensualidad / cuota */
  monthlyFee?: string;
  /** Nota de pago, ej. "4 cuotas semestrales" */
  paymentNote?: string;
  startDate?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image?: string;
  department?: string;
}

/** @deprecated Usar PersonItem / PortalPersonCardData */
export type { PersonItem } from "@/types/people-grid";

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  href: string;
  image?: string;
  featured?: boolean;
  author?: string;
  readTime?: string;
  status?: ContentStatus;
  ctaLabel?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  href: string;
  image?: string;
  excerpt?: string;
  ctaLabel?: string;
}

export interface AcademicAgendaItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  startDate: string;
  startDateLabel: string;
  endDate?: string;
  endDateLabel?: string;
  href: string;
  image?: string;
  color?: string;
  featured?: boolean;
  ctaLabel?: string;
}

export interface InstitutionalNoticeItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  href: string;
  image?: string;
  featured?: boolean;
  priority?: number;
  publishedAt: string;
  publishedAtLabel: string;
  expiresAt?: string;
  ctaLabel?: string;
  attachmentUrl?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  href: string;
  description?: string;
  image?: string;
  resourceType?: string;
  ctaLabel?: string;
}

export interface ResourceHighlightItem {
  id: string;
  title: string;
  description: string;
  resourceType?: string;
  icon?: string;
  href: string;
  image?: string;
  ctaLabel?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  image?: string;
  program?: string;
  rating?: number;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
}

export interface ContentQueryFilters {
  featured?: boolean;
  published?: boolean;
  category?: string;
  categoryId?: string;
  tags?: string[];
  status?: ContentStatus;
  slug?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  /** Agenda académica — solo hitos vigentes o futuros */
  upcoming?: boolean;
  /** Personas — tipo (teacher, authority, speaker, etc.) */
  personRole?: string;
}

export interface ContentQuerySort {
  field: string;
  direction: SortDirection;
}

export interface ContentQueryPagination {
  page?: number;
  limit?: number;
}

export interface ContentQuery {
  tenant: string;
  collection: string;
  filters?: ContentQueryFilters;
  sort?: ContentQuerySort;
  pagination?: ContentQueryPagination;
}

export interface ContentResult<T = ContentDocument> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

/** Configuración de query embebida en bloques del Page Builder */
export interface BlockContentQuery {
  collection: string;
  featured?: boolean;
  published?: boolean;
  category?: string;
  categoryId?: string;
  tags?: string[];
  status?: ContentStatus;
  slug?: string;
  search?: string;
  limit?: number;
  upcoming?: boolean;
  sort?: ContentQuerySort;
  personRole?: string;
}
