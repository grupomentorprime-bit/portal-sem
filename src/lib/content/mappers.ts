import type { AllowedCollection } from "@/lib/content/types";
import {
  academicAgendaCategoryLabel,
  institutionalNoticeCategoryLabel,
} from "@/types/academic-portal";
import type {
  AcademicAgendaItem,
  ContentDocument,
  EventItem,
  GalleryItem,
  InstitutionalNoticeItem,
  LibraryItem,
  NewsItem,
  ProgramItem,
  TeacherItem,
  TestimonialItem,
} from "@/types/content";
import type { PersonItem } from "@/types/people-grid";

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function slugHref(base: string, slug: string): string {
  return `${base}/${slug}`.replace(/\/+/g, "/");
}

export function mapToProgramItem(doc: ContentDocument): ProgramItem {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.summary || doc.content?.slice(0, 160) || "",
    duration: doc.duration ?? "",
    icon: doc.icon ?? "BookOpen",
    href: doc.href || slugHref("/programas", doc.slug),
    image: doc.image || undefined,
    category: doc.category || doc.categories?.[0] || undefined,
    categories: doc.categories?.length ? doc.categories : undefined,
    color: doc.color || undefined,
    modality: doc.modality,
    status: doc.programStatus,
    badge: doc.badge,
    featured: doc.featured,
    certification: doc.certification,
    price: doc.fees,
    showPrice: doc.showPrice,
    startDate: doc.startDate ? formatDate(doc.startDate) : undefined,
    ctaPrimaryLabel: doc.ctaPrimaryLabel,
    ctaSecondaryLabel: doc.ctaSecondaryLabel,
    ctaSecondaryHref: doc.ctaSecondaryHref,
  };
}

export function mapToTeacherItem(doc: ContentDocument): TeacherItem {
  const person = mapToPersonItem(doc);
  return {
    id: person.id,
    name: person.name,
    role: person.position ?? "",
    specialty: person.specialty ?? "",
    image: person.image,
    department: doc.department,
  };
}

export function mapToPersonItem(doc: ContentDocument): PersonItem {
  const bio = doc.summary || (doc.content ? doc.content.slice(0, 240) : "");
  const authorityRoles = new Set(["Rector", "Decano Académico", "Decano", "Director"]);
  const inferredRole =
    doc.personRole ||
    (authorityRoles.has(doc.role ?? "") ? "authority" : "teacher");

  return {
    id: doc._id,
    name: doc.name || doc.title,
    position: doc.role ?? "",
    specialty: doc.specialty ?? "",
    bio: bio || undefined,
    image: doc.image || undefined,
    email: doc.email,
    phone: doc.phone,
    linkedin: doc.linkedin,
    facebook: doc.facebook,
    instagram: doc.instagram,
    href: doc.href || (doc.slug ? slugHref("/equipo", doc.slug) : undefined),
    personRole: inferredRole,
    teamGroup: doc.category,
    featured: doc.featured,
    personStatus: doc.personStatus || (doc.featured ? "featured" : "active"),
    order: doc.order,
    visible: doc.visible !== false,
  };
}

function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "";
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

export function mapToNewsItem(doc: ContentDocument): NewsItem {
  const excerpt = doc.excerpt || doc.summary || "";
  const body = doc.content || excerpt;
  return {
    id: doc._id,
    title: doc.title,
    excerpt,
    date: doc.date || formatDate(doc.publishedAt),
    category: doc.category || doc.categories?.[0] || "",
    href: doc.href || slugHref("/noticias", doc.slug),
    image: doc.image || undefined,
    featured: doc.featured,
    author: doc.author || undefined,
    readTime: body ? estimateReadTime(body) : undefined,
    status: doc.status,
  };
}

export function mapToEventItem(doc: ContentDocument): EventItem {
  return {
    id: doc._id,
    title: doc.title,
    date: doc.date || formatDate(doc.publishedAt),
    time: doc.time,
    location: doc.location ?? "",
    href: doc.href || slugHref("/eventos", doc.slug),
    image: doc.image || undefined,
    excerpt: doc.excerpt || doc.summary || undefined,
  };
}

export function mapToAcademicAgendaItem(doc: ContentDocument): AcademicAgendaItem {
  const category = doc.category || doc.categories?.[0] || "";
  return {
    id: doc._id,
    title: doc.title,
    category,
    categoryLabel: academicAgendaCategoryLabel(category),
    description: doc.summary || doc.content?.slice(0, 200) || "",
    startDate: doc.startDate || doc.publishedAt,
    startDateLabel: formatDate(doc.startDate || doc.publishedAt),
    endDate: doc.endDate || undefined,
    endDateLabel: doc.endDate ? formatDate(doc.endDate) : undefined,
    href: doc.href || slugHref("/agenda-academica", doc.slug),
    image: doc.image || undefined,
    color: doc.color,
    featured: doc.featured,
    ctaLabel: doc.ctaPrimaryLabel,
  };
}

export function mapToInstitutionalNoticeItem(doc: ContentDocument): InstitutionalNoticeItem {
  const category = doc.category || doc.categories?.[0] || "";
  return {
    id: doc._id,
    title: doc.title,
    summary: doc.summary || doc.excerpt || "",
    category,
    categoryLabel: institutionalNoticeCategoryLabel(category),
    href: doc.href || slugHref("/avisos", doc.slug),
    image: doc.image || undefined,
    featured: doc.featured,
    priority: doc.priority,
    publishedAt: doc.publishedAt,
    publishedAtLabel: formatDate(doc.publishedAt),
    expiresAt: doc.expiresAt || undefined,
    ctaLabel: doc.ctaPrimaryLabel,
  };
}

export function mapToLibraryItem(doc: ContentDocument): LibraryItem {
  return {
    id: doc._id,
    title: doc.title,
    author: doc.author || doc.summary || "",
    href: doc.href || slugHref("/biblioteca", doc.slug),
    description: doc.summary || doc.excerpt || undefined,
    image: doc.image || undefined,
    resourceType: doc.resourceType || doc.category || doc.categories?.[0],
    ctaLabel: doc.ctaPrimaryLabel,
  };
}

export function mapToTestimonialItem(doc: ContentDocument): TestimonialItem {
  return {
    id: doc._id,
    quote: doc.quote || doc.summary || "",
    author: doc.author || doc.title,
    role: doc.role ?? "",
    image: doc.image || undefined,
    program: doc.program ?? doc.category ?? undefined,
    rating: typeof doc.rating === "number" ? doc.rating : undefined,
  };
}

export function mapToGalleryItem(doc: ContentDocument): GalleryItem {
  return {
    id: doc._id,
    src: doc.src || doc.image || "",
    alt: doc.alt || doc.title,
  };
}

const COLLECTION_MAPPERS: Partial<
  Record<AllowedCollection, (doc: ContentDocument) => unknown>
> = {
  academy_programs: mapToProgramItem,
  academy_teachers: mapToPersonItem,
  academy_team: mapToPersonItem,
  content_people: mapToPersonItem,
  content_news: mapToNewsItem,
  content_events: mapToEventItem,
  content_academic_agenda: mapToAcademicAgendaItem,
  content_institutional_notices: mapToInstitutionalNoticeItem,
  content_library: mapToLibraryItem,
  academy_testimonials: mapToTestimonialItem,
  academy_gallery: mapToGalleryItem,
};

export function mapDocumentsForCollection(
  collection: AllowedCollection,
  docs: ContentDocument[]
): unknown[] {
  const mapper = COLLECTION_MAPPERS[collection];
  if (!mapper) return docs;
  return docs.map((doc) => mapper(doc));
}
