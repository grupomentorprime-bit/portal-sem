import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { computeItemLevels } from "@/lib/cms/menu-utils";
import {
  resourceIdCandidates,
  scopedResourceId,
} from "@/core/tenant/resource-ids";
import type { CmsMenu, CmsMenuCreate, CmsMenuUpdate } from "@/types/menu";

const CMS_MENUS_TAG = "cms-menus";

function menuTenantFilter(tenant: string) {
  return { tenant };
}

async function fetchAllMenusFromDb(tenant: string): Promise<CmsMenu[]> {
  const db = await getDatabase();
  const menus = await db
    .collection<CmsMenu>("cms_menus")
    .find(menuTenantFilter(tenant))
    .sort({ name: 1 })
    .toArray();

  return menus.map(normalizeMenu);
}

async function fetchMenuByIdFromDb(id: string, tenant: string): Promise<CmsMenu | null> {
  const db = await getDatabase();
  const candidates = resourceIdCandidates(tenant, id);
  const menus = await db
    .collection<CmsMenu>("cms_menus")
    .find({
      _id: { $in: candidates },
      ...menuTenantFilter(tenant),
    })
    .toArray();

  if (menus.length === 0) return null;
  const preferred = menus.find((m) => m._id === candidates[0]) ?? menus[0];
  return normalizeMenu(preferred);
}

function normalizeMenu(menu: CmsMenu): CmsMenu {
  return {
    ...menu,
    items: computeItemLevels(menu.items ?? []),
  };
}

export const getAllMenus = (tenant: string) =>
  unstable_cache(
    async () => fetchAllMenusFromDb(tenant),
    [`cms-menus-all-${tenant}`],
    { tags: [CMS_MENUS_TAG], revalidate: 60 }
  );

export async function getAllMenusUncached(tenant: string): Promise<CmsMenu[]> {
  return fetchAllMenusFromDb(tenant);
}

export const getMenuById = (id: string, tenant: string) =>
  unstable_cache(
    async () => fetchMenuByIdFromDb(id, tenant),
    [`cms-menu-${id}-${tenant}`],
    { tags: [CMS_MENUS_TAG, `cms-menu-${id}`], revalidate: 60 }
  );

export async function getMenuByIdUncached(
  id: string,
  tenant: string
): Promise<CmsMenu | null> {
  return fetchMenuByIdFromDb(id, tenant);
}

export async function getActiveMenuById(
  id: string,
  tenant: string
): Promise<CmsMenu | null> {
  const menu = await getMenuById(id, tenant)();
  if (!menu || !menu.active) return null;
  return menu;
}

export async function createMenu(data: CmsMenuCreate): Promise<CmsMenu> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  if (!data.tenant?.trim()) {
    throw new Error("tenant es obligatorio para crear un menú.");
  }
  const tenant = data.tenant.trim();
  const physicalId = scopedResourceId(tenant, data._id);

  const document: CmsMenu = {
    _id: physicalId,
    tenant,
    name: data.name,
    location: data.location,
    active: data.active ?? true,
    items: computeItemLevels(data.items ?? []),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<CmsMenu>("cms_menus").insertOne(document);
  revalidateTag(CMS_MENUS_TAG, "max");
  revalidateTag(`cms-menu-${physicalId}`, "max");

  return document;
}

export async function updateMenu(
  id: string,
  tenant: string,
  data: CmsMenuUpdate
): Promise<CmsMenu | null> {
  const db = await getDatabase();
  const existing = await fetchMenuByIdFromDb(id, tenant);

  if (!existing) return null;

  const now = new Date().toISOString();
  const document: CmsMenu = {
    _id: existing._id,
    tenant,
    name: data.name,
    location: data.location,
    active: data.active,
    items: computeItemLevels(data.items ?? []),
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await db
    .collection<CmsMenu>("cms_menus")
    .replaceOne({ _id: existing._id, tenant }, document);
  revalidateTag(CMS_MENUS_TAG, "max");
  revalidateTag(`cms-menu-${existing._id}`, "max");

  return document;
}

export async function deleteMenu(id: string, tenant: string): Promise<boolean> {
  const db = await getDatabase();
  const existing = await fetchMenuByIdFromDb(id, tenant);
  if (!existing) return false;

  const result = await db
    .collection<CmsMenu>("cms_menus")
    .deleteOne({ _id: existing._id, tenant });

  if (result.deletedCount > 0) {
    revalidateTag(CMS_MENUS_TAG, "max");
    revalidateTag(`cms-menu-${existing._id}`, "max");
    return true;
  }

  return false;
}

export async function duplicateMenu(
  sourceId: string,
  tenant: string,
  newId: string,
  newName: string
): Promise<CmsMenu | null> {
  const source = await fetchMenuByIdFromDb(sourceId, tenant);
  if (!source) return null;

  return createMenu({
    _id: newId,
    tenant,
    name: newName,
    location: source.location,
    active: false,
    items: source.items.map((item) => ({ ...item })),
  });
}

export async function menuExists(id: string, tenant: string): Promise<boolean> {
  const menu = await fetchMenuByIdFromDb(id, tenant);
  return menu !== null;
}
