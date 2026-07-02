import "server-only";

import { getDatabase } from "@/lib/mongodb";
import { revalidateContentCache } from "@/lib/content/cache";
import { isEditableCollection } from "@/lib/content/content-sections";
import { ALLOWED_COLLECTIONS, type AllowedCollection } from "@/lib/content/types";
import { slugify } from "@/lib/slugify";
import type { CategoryItem, ContentDocument, ContentStatus } from "@/types/content";

export { isEditableCollection };

export interface ContentWriteInput {
  _id?: string;
  tenant: string;
  collection: AllowedCollection;
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  category?: string;
  status?: ContentStatus;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  color?: string;
  visibleFrom?: string;
  visibleUntil?: string;
  href?: string;
  ctaPrimaryLabel?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  priority?: number;
  publishedAt?: string;
  expiresAt?: string;
  imageMediaId?: string;
  attachmentMediaId?: string;
  /** Personas */
  name?: string;
  role?: string;
  specialty?: string;
  personRole?: string;
  personStatus?: string;
  order?: number;
  visible?: boolean;
  email?: string;
  phone?: string;
  linkedin?: string;
  /** Programas */
  duration?: string;
  modality?: string;
  programStatus?: "active" | "admission_open" | "coming_soon";
  certification?: string;
  icon?: string;
  fees?: string;
  showPrice?: boolean;
  badge?: string;
  /** Noticias / eventos */
  excerpt?: string;
  author?: string;
  date?: string;
  location?: string;
  time?: string;
  /** Biblioteca */
  resourceType?: string;
  /** Testimonios */
  quote?: string;
  program?: string;
  rating?: number;
  /** Galería */
  alt?: string;
  srcMediaId?: string;
  /** Categorías */
  enabled?: boolean;
}

export interface ContentValidationError {
  field: string;
  message: string;
}

export function validateContentWrite(input: ContentWriteInput): ContentValidationError[] {
  const errors: ContentValidationError[] = [];

  if (!input.tenant?.trim()) errors.push({ field: "tenant", message: "Tenant requerido." });
  if (!input.collection || !ALLOWED_COLLECTIONS.includes(input.collection)) {
    errors.push({ field: "collection", message: "Colección no válida." });
  } else if (!isEditableCollection(input.collection)) {
    errors.push({ field: "collection", message: "Colección no editable." });
  }

  const displayTitle =
    input.collection === "academy_categories"
      ? input.name?.trim() || input.title?.trim()
      : input.collection === "academy_testimonials"
        ? input.author?.trim() || input.title?.trim()
        : input.title?.trim();

  if (!displayTitle) {
    const field =
      input.collection === "academy_categories"
        ? "name"
        : input.collection === "academy_testimonials"
          ? "author"
          : "title";
    errors.push({ field, message: "Título requerido." });
  }

  if (input.collection === "content_academic_agenda" && !input.startDate?.trim()) {
    errors.push({ field: "startDate", message: "Fecha de inicio requerida." });
  }

  if (input.collection === "content_people") {
    if (!input.category?.trim()) {
      errors.push({ field: "category", message: "Selecciona el tipo de equipo." });
    }
    if (!input.role?.trim()) {
      errors.push({ field: "role", message: "El cargo es obligatorio." });
    }
  }

  if (input.collection === "academy_testimonials" && !input.quote?.trim() && !input.summary?.trim()) {
    errors.push({ field: "quote", message: "El testimonio es obligatorio." });
  }

  return errors;
}

function buildDocument(input: ContentWriteInput, existing?: ContentDocument): ContentDocument {
  const now = new Date().toISOString();
  const displayName = input.name?.trim() || input.title.trim();
  const slug = input.slug?.trim() || slugify(displayName) || `item-${Date.now()}`;
  const id = input._id?.trim() || slug;

  return {
    _id: id,
    tenant: input.tenant,
    title: displayName,
    slug,
    name: input.name?.trim() || existing?.name || displayName,
    role: input.role?.trim() ?? existing?.role,
    specialty: input.specialty?.trim() ?? existing?.specialty,
    personRole: input.personRole ?? existing?.personRole,
    personStatus: (input.personStatus as ContentDocument["personStatus"]) ?? existing?.personStatus,
    order: input.order ?? existing?.order,
    visible: input.visible ?? existing?.visible ?? true,
    email: input.email?.trim() ?? existing?.email,
    phone: input.phone?.trim() ?? existing?.phone,
    linkedin: input.linkedin?.trim() ?? existing?.linkedin,
    summary: input.summary?.trim() ?? existing?.summary ?? "",
    content: input.content?.trim() ?? existing?.content ?? "",
    excerpt: input.excerpt?.trim() ?? existing?.excerpt ?? input.summary?.trim() ?? existing?.summary ?? "",
    image: existing?.image ?? "",
    imageMediaId: input.imageMediaId ?? existing?.imageMediaId,
    coverMediaId: input.imageMediaId ?? existing?.coverMediaId,
    photoMediaId: input.imageMediaId ?? existing?.photoMediaId,
    srcMediaId: input.srcMediaId ?? existing?.srcMediaId,
    attachmentMediaId: input.attachmentMediaId ?? existing?.attachmentMediaId,
    status: input.status ?? existing?.status ?? "draft",
    featured: input.featured ?? existing?.featured ?? false,
    categories: input.category ? [input.category] : existing?.categories ?? [],
    category: input.category ?? existing?.category,
    tags: existing?.tags ?? [],
    seo: existing?.seo ?? { title: displayName, description: input.summary ?? "", keywords: [] },
    publishedAt: input.publishedAt ?? input.date ?? existing?.publishedAt ?? now,
    expiresAt: input.expiresAt ?? existing?.expiresAt ?? "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    startDate: input.startDate ?? existing?.startDate,
    endDate: input.endDate ?? existing?.endDate,
    color: input.color ?? existing?.color,
    visibleFrom: input.visibleFrom ?? existing?.visibleFrom,
    visibleUntil: input.visibleUntil ?? existing?.visibleUntil,
    href: input.href ?? existing?.href,
    ctaPrimaryLabel: input.ctaPrimaryLabel ?? existing?.ctaPrimaryLabel,
    ctaSecondaryLabel: input.ctaSecondaryLabel ?? existing?.ctaSecondaryLabel,
    ctaSecondaryHref: input.ctaSecondaryHref ?? existing?.ctaSecondaryHref,
    priority: input.priority ?? existing?.priority,
    duration: input.duration ?? existing?.duration,
    modality: input.modality ?? existing?.modality,
    programStatus: input.programStatus ?? existing?.programStatus,
    certification: input.certification ?? existing?.certification,
    icon: input.icon ?? existing?.icon,
    fees: input.fees ?? existing?.fees,
    showPrice: input.showPrice ?? existing?.showPrice,
    badge: input.badge ?? existing?.badge,
    author: input.author?.trim() ?? existing?.author,
    date: input.date ?? existing?.date,
    location: input.location ?? existing?.location,
    time: input.time ?? existing?.time,
    resourceType: input.resourceType ?? existing?.resourceType,
    quote: input.quote?.trim() ?? existing?.quote ?? input.summary?.trim(),
    program: input.program ?? existing?.program,
    rating: input.rating ?? existing?.rating,
    alt: input.alt?.trim() ?? existing?.alt ?? displayName,
    src: existing?.src ?? "",
  };
}

function buildCategoryDocument(input: ContentWriteInput, existing?: CategoryItem): CategoryItem {
  const now = new Date().toISOString();
  const name = input.name?.trim() || input.title.trim();
  const slug = input.slug?.trim() || slugify(name) || `cat-${Date.now()}`;
  const id = input._id?.trim() || slug;

  return {
    _id: id,
    tenant: input.tenant,
    name,
    slug,
    description: input.summary?.trim() ?? existing?.description ?? "",
    parentId: existing?.parentId,
    order: input.order ?? existing?.order ?? 0,
    enabled: input.enabled ?? existing?.enabled ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function createContentItem(input: ContentWriteInput): Promise<ContentDocument | CategoryItem> {
  const db = await getDatabase();

  if (input.collection === "academy_categories") {
    const doc = buildCategoryDocument(input);
    const col = db.collection<CategoryItem>(input.collection);
    const exists = await col.findOne({ _id: doc._id, tenant: input.tenant });
    if (exists) {
      throw new Error(`Ya existe un documento con id "${doc._id}".`);
    }
    await col.insertOne(doc);
    revalidateContentCache(input.collection, input.tenant);
    return doc;
  }

  const doc = buildDocument(input);
  const col = db.collection<ContentDocument>(input.collection);
  const exists = await col.findOne({ _id: doc._id, tenant: input.tenant });
  if (exists) {
    throw new Error(`Ya existe un documento con id "${doc._id}".`);
  }

  await col.insertOne(doc);
  revalidateContentCache(input.collection, input.tenant);
  return doc;
}

export async function updateContentItem(
  id: string,
  input: ContentWriteInput
): Promise<ContentDocument | CategoryItem | null> {
  const db = await getDatabase();

  if (input.collection === "academy_categories") {
    const col = db.collection<CategoryItem>(input.collection);
    const existing = await col.findOne({ _id: id, tenant: input.tenant });
    if (!existing) return null;
    const doc = buildCategoryDocument({ ...input, _id: id }, existing);
    await col.replaceOne({ _id: id, tenant: input.tenant }, doc);
    revalidateContentCache(input.collection, input.tenant);
    return doc;
  }

  const col = db.collection<ContentDocument>(input.collection);
  const existing = await col.findOne({ _id: id, tenant: input.tenant });
  if (!existing) return null;

  const doc = buildDocument({ ...input, _id: id }, existing);
  await col.replaceOne({ _id: id, tenant: input.tenant }, doc);
  revalidateContentCache(input.collection, input.tenant);
  return doc;
}

export async function deleteContentItem(
  tenant: string,
  collection: AllowedCollection,
  id: string
): Promise<boolean> {
  const db = await getDatabase();
  const result = await db
    .collection<ContentDocument | CategoryItem>(collection)
    .deleteOne({ _id: id, tenant });
  if (result.deletedCount > 0) {
    revalidateContentCache(collection, tenant);
    return true;
  }
  return false;
}

export async function getContentItem(
  tenant: string,
  collection: AllowedCollection,
  id: string
): Promise<ContentDocument | null> {
  const db = await getDatabase();
  return db.collection<ContentDocument>(collection).findOne({ _id: id, tenant });
}

export async function getCategoryItem(
  tenant: string,
  id: string
): Promise<CategoryItem | null> {
  const db = await getDatabase();
  return db.collection<CategoryItem>("academy_categories").findOne({ _id: id, tenant });
}
