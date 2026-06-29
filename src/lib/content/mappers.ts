import type { AllowedCollection } from "@/lib/content/types";
import type {
  ContentDocument,
  EventItem,
  GalleryItem,
  LibraryItem,
  NewsItem,
  ProgramItem,
  TeacherItem,
  TestimonialItem,
} from "@/types/content";

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
  };
}

export function mapToTeacherItem(doc: ContentDocument): TeacherItem {
  return {
    id: doc._id,
    name: doc.name || doc.title,
    role: doc.role ?? "",
    specialty: doc.specialty ?? doc.summary ?? "",
    image: doc.image || undefined,
  };
}

export function mapToNewsItem(doc: ContentDocument): NewsItem {
  return {
    id: doc._id,
    title: doc.title,
    excerpt: doc.excerpt || doc.summary || "",
    date: doc.date || formatDate(doc.publishedAt),
    category: doc.category || doc.categories?.[0] || "",
    href: doc.href || slugHref("/noticias", doc.slug),
    image: doc.image || undefined,
  };
}

export function mapToEventItem(doc: ContentDocument): EventItem {
  return {
    id: doc._id,
    title: doc.title,
    date: doc.date || formatDate(doc.publishedAt),
    location: doc.location ?? "",
    href: doc.href || slugHref("/eventos", doc.slug),
  };
}

export function mapToLibraryItem(doc: ContentDocument): LibraryItem {
  return {
    id: doc._id,
    title: doc.title,
    author: doc.author || doc.summary || "",
    href: doc.href || slugHref("/biblioteca", doc.slug),
  };
}

export function mapToTestimonialItem(doc: ContentDocument): TestimonialItem {
  return {
    id: doc._id,
    quote: doc.quote || doc.summary || "",
    author: doc.author || doc.title,
    role: doc.role ?? "",
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
  academy_teachers: mapToTeacherItem,
  academy_team: mapToTeacherItem,
  content_news: mapToNewsItem,
  content_events: mapToEventItem,
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
