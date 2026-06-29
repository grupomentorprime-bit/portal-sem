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
  image: string;
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
  src?: string;
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
export interface ProgramItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  href: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  href: string;
  image?: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  href: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  href: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
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
  sort?: ContentQuerySort;
}
