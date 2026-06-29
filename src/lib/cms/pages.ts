import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { mergeBlockSettings } from "@/lib/cms/page-validation";
import { sortBlocks } from "@/lib/cms/page-utils";
import { stripPageBlocksForSave } from "@/lib/content/block-queries";
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

async function fetchAllPagesFromDb(tenant?: string): Promise<CmsPage[]> {
  const db = await getDatabase();
  const filter = tenant ? { tenant } : {};
  const pages = await db
    .collection<CmsPage>("cms_pages")
    .find(filter)
    .sort({ title: 1 })
    .toArray();
  return pages.map(normalizePage);
}

async function fetchPageByIdFromDb(id: string): Promise<CmsPage | null> {
  const db = await getDatabase();
  const page = await db.collection<CmsPage>("cms_pages").findOne({ _id: id });
  return page ? normalizePage(page) : null;
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

export const getAllPages = (tenant?: string) =>
  unstable_cache(
    async () => fetchAllPagesFromDb(tenant),
    [`cms-pages-all-${tenant ?? "all"}`],
    { tags: [CMS_PAGES_TAG], revalidate: 60 }
  );

export async function getAllPagesUncached(tenant?: string): Promise<CmsPage[]> {
  return fetchAllPagesFromDb(tenant);
}

export const getPageById = (id: string) =>
  unstable_cache(
    async () => fetchPageByIdFromDb(id),
    [`cms-page-${id}`],
    { tags: [CMS_PAGES_TAG, `cms-page-${id}`], revalidate: 60 }
  );

export async function getPageByIdUncached(id: string): Promise<CmsPage | null> {
  return fetchPageByIdFromDb(id);
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

export async function createPage(data: CmsPageCreate): Promise<CmsPage> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const document: CmsPage = {
    _id: data._id,
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
  revalidatePageTags(document);
  return document;
}

export async function updatePage(
  id: string,
  data: CmsPageUpdate,
  options?: { saveVersion?: boolean }
): Promise<CmsPage | null> {
  const db = await getDatabase();
  const existing = await fetchPageByIdFromDb(id);
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

  await db.collection<CmsPage>("cms_pages").replaceOne({ _id: id }, document);
  revalidatePageTags(document);
  return document;
}

export async function deletePage(id: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await fetchPageByIdFromDb(id);
  const result = await db.collection<CmsPage>("cms_pages").deleteOne({ _id: id });
  if (result.deletedCount > 0 && existing) {
    revalidatePageTags(existing);
    return true;
  }
  return false;
}

export async function duplicatePage(
  sourceId: string,
  newId: string,
  newTitle: string,
  newSlug: string
): Promise<CmsPage | null> {
  const source = await fetchPageByIdFromDb(sourceId);
  if (!source) return null;

  return createPage({
    _id: newId,
    tenant: source.tenant,
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

export async function pageExists(id: string): Promise<boolean> {
  const db = await getDatabase();
  const count = await db.collection<CmsPage>("cms_pages").countDocuments({ _id: id });
  return count > 0;
}

export async function pageSlugExists(
  slug: string,
  tenant: string,
  excludeId?: string
): Promise<boolean> {
  const db = await getDatabase();
  const filter: Record<string, unknown> = { slug, tenant };
  if (excludeId) filter._id = { $ne: excludeId };
  const count = await db.collection("cms_pages").countDocuments(filter);
  return count > 0;
}

function revalidatePageTags(page: CmsPage) {
  revalidateTag(CMS_PAGES_TAG, "max");
  revalidateTag(`cms-page-${page._id}`, "max");
  revalidateTag(`cms-page-slug-${page.tenant}-${page.slug}`, "max");
}
