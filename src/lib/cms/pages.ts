import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { mergeBlockSettings } from "@/lib/cms/page-validation";
import { sortBlocks } from "@/lib/cms/page-utils";
import { stripPageBlocksForSave } from "@/lib/content/block-queries";
import {
  resourceIdCandidates,
  scopedResourceId,
} from "@/core/tenant/resource-ids";
import type { CmsPage, CmsPageCreate, CmsPageUpdate, PageBlock } from "@/types/page";

const CMS_PAGES_TAG = "cms-pages";

function normalizePage(page: CmsPage): CmsPage {
  return {
    ...page,
    slug: page.slug === "/" ? "/" : page.slug,
    blocks: sortBlocks(
      (page.blocks ?? []).map((block) => ({
        ...block,
        settings: mergeBlockSettings(block.type, block.settings),
      }))
    ),
    versions: page.versions ?? [],
    seo: page.seo ?? {},
  };
}

function pageTenantFilter(tenant: string) {
  return { tenant };
}

async function fetchAllPagesFromDb(tenant: string): Promise<CmsPage[]> {
  const db = await getDatabase();
  const pages = await db
    .collection<CmsPage>("cms_pages")
    .find(pageTenantFilter(tenant))
    .sort({ title: 1 })
    .toArray();
  return pages.map(normalizePage);
}

async function fetchPageByIdFromDb(id: string, tenant: string): Promise<CmsPage | null> {
  const db = await getDatabase();
  const candidates = resourceIdCandidates(tenant, id);
  const pages = await db
    .collection<CmsPage>("cms_pages")
    .find({
      _id: { $in: candidates },
      ...pageTenantFilter(tenant),
    })
    .toArray();

  if (pages.length === 0) return null;

  // Preferir scoped sobre bare (compat).
  const preferred =
    pages.find((p) => p._id === candidates[0]) ?? pages[0];
  return normalizePage(preferred);
}

async function fetchPageBySlugFromDb(
  slug: string,
  tenant: string
): Promise<CmsPage | null> {
  const db = await getDatabase();
  const page = await db.collection<CmsPage>("cms_pages").findOne({
    slug,
    tenant,
    status: "published",
  });
  return page ? normalizePage(page) : null;
}

export const getAllPages = (tenant: string) =>
  unstable_cache(
    async () => fetchAllPagesFromDb(tenant),
    [`cms-pages-all-${tenant}`],
    { tags: [CMS_PAGES_TAG], revalidate: 60 }
  );

export async function getAllPagesUncached(tenant: string): Promise<CmsPage[]> {
  return fetchAllPagesFromDb(tenant);
}

export const getPageById = (id: string, tenant: string) =>
  unstable_cache(
    async () => fetchPageByIdFromDb(id, tenant),
    [`cms-page-${tenant}-${id}`],
    { tags: [CMS_PAGES_TAG, `cms-page-${id}`], revalidate: 60 }
  );

export async function getPageByIdUncached(
  id: string,
  tenant: string
): Promise<CmsPage | null> {
  return fetchPageByIdFromDb(id, tenant);
}

export async function getPublishedPageBySlug(
  slug: string,
  tenant: string
): Promise<CmsPage | null> {
  return unstable_cache(
    async () => fetchPageBySlugFromDb(slug, tenant),
    [`cms-page-slug-${tenant}-${slug}`],
    { tags: [CMS_PAGES_TAG, `cms-page-slug-${tenant}-${slug}`], revalidate: 60 }
  )();
}

export async function createPage(
  data: CmsPageCreate,
  options?: { revalidate?: boolean }
): Promise<CmsPage> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const physicalId = scopedResourceId(data.tenant, data._id);

  const document: CmsPage = {
    _id: physicalId,
    tenant: data.tenant,
    title: data.title,
    slug: data.slug,
    description: data.description ?? "",
    status: data.status ?? "draft",
    template: data.template,
    seo: data.seo ?? {},
    blocks: sortBlocks(stripPageBlocksForSave(data.blocks ?? [])).map((b, i) => ({
      ...b,
      order: i,
      settings: mergeBlockSettings(b.type, b.settings),
    })),
    scheduledAt: data.scheduledAt,
    versions: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<CmsPage>("cms_pages").insertOne(document);
  if (options?.revalidate !== false) {
    revalidatePageTags(document);
  }
  return document;
}

export async function updatePage(
  id: string,
  tenant: string,
  data: CmsPageUpdate,
  options?: { saveVersion?: boolean }
): Promise<CmsPage | null> {
  const db = await getDatabase();
  const existing = await fetchPageByIdFromDb(id, tenant);
  if (!existing) return null;

  const now = new Date().toISOString();
  const versions = [...(existing.versions ?? [])];

  if (options?.saveVersion && existing.status === "published") {
    versions.unshift({
      title: existing.title,
      blocks: existing.blocks,
      seo: existing.seo,
      savedAt: now,
    });
    if (versions.length > 10) versions.length = 10;
  }

  const document: CmsPage = {
    ...existing,
    tenant,
    title: data.title ?? existing.title,
    slug: data.slug ?? existing.slug,
    description: data.description ?? existing.description,
    status: data.status ?? existing.status,
    template: data.template ?? existing.template,
    seo: data.seo ?? existing.seo,
    blocks: sortBlocks(stripPageBlocksForSave(data.blocks ?? existing.blocks)).map((b, i) => ({
      ...b,
      order: i,
      settings: mergeBlockSettings(b.type, b.settings),
    })),
    scheduledAt: data.scheduledAt ?? existing.scheduledAt,
    versions,
    updatedAt: now,
  };

  await db
    .collection<CmsPage>("cms_pages")
    .replaceOne({ _id: existing._id, tenant }, document);
  revalidatePageTags(document);
  return document;
}

export async function deletePage(id: string, tenant: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await fetchPageByIdFromDb(id, tenant);
  if (!existing) return false;
  const result = await db
    .collection<CmsPage>("cms_pages")
    .deleteOne({ _id: existing._id, tenant });
  if (result.deletedCount > 0) {
    revalidatePageTags(existing);
    return true;
  }
  return false;
}

export async function duplicatePage(
  sourceId: string,
  tenant: string,
  newId: string,
  newTitle: string,
  newSlug: string
): Promise<CmsPage | null> {
  const source = await fetchPageByIdFromDb(sourceId, tenant);
  if (!source) return null;

  return createPage({
    _id: newId,
    tenant,
    title: newTitle,
    slug: newSlug,
    description: source.description,
    template: source.template,
    seo: { ...source.seo },
    blocks: source.blocks.map((b) => ({
      ...b,
      id: `${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      settings: JSON.parse(JSON.stringify(b.settings)) as PageBlock["settings"],
    })),
    status: "draft",
  });
}

export async function pageExists(id: string, tenant: string): Promise<boolean> {
  const page = await fetchPageByIdFromDb(id, tenant);
  return page !== null;
}

export async function pageSlugExists(
  slug: string,
  tenant: string,
  excludeId?: string
): Promise<boolean> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { slug, tenant };
  if (excludeId) {
    const candidates = resourceIdCandidates(tenant, excludeId);
    filter._id = { $nin: candidates };
  }
  const count = await db.collection("cms_pages").countDocuments(filter);
  return count > 0;
}

function revalidatePageTags(page: CmsPage) {
  revalidateTag(CMS_PAGES_TAG, "max");
  revalidateTag(`cms-page-${page._id}`, "max");
  revalidateTag(`cms-page-slug-${page.tenant}-${page.slug}`, "max");
}
