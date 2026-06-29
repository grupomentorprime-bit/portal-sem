import { unstable_cache, revalidateTag } from "next/cache";
import { getDatabase } from "@/lib/mongodb";
import { computeItemLevels } from "@/lib/cms/menu-utils";
import type { CmsMenu, CmsMenuCreate, CmsMenuUpdate } from "@/types/menu";

const CMS_MENUS_TAG = "cms-menus";

async function fetchAllMenusFromDb(): Promise<CmsMenu[]> {
  const db = await getDatabase();
  const menus = await db
    .collection<CmsMenu>("cms_menus")
    .find({})
    .sort({ name: 1 })
    .toArray();

  return menus.map(normalizeMenu);
}

async function fetchMenuByIdFromDb(id: string): Promise<CmsMenu | null> {
  const db = await getDatabase();
  const menu = await db.collection<CmsMenu>("cms_menus").findOne({ _id: id });
  return menu ? normalizeMenu(menu) : null;
}

function normalizeMenu(menu: CmsMenu): CmsMenu {
  return {
    ...menu,
    items: computeItemLevels(menu.items ?? []),
  };
}

export const getAllMenus = unstable_cache(
  fetchAllMenusFromDb,
  ["cms-menus-all"],
  { tags: [CMS_MENUS_TAG], revalidate: 60 }
);

export async function getAllMenusUncached(): Promise<CmsMenu[]> {
  return fetchAllMenusFromDb();
}

export const getMenuById = (id: string) =>
  unstable_cache(
    async () => fetchMenuByIdFromDb(id),
    [`cms-menu-${id}`],
    { tags: [CMS_MENUS_TAG, `cms-menu-${id}`], revalidate: 60 }
  );

export async function getMenuByIdUncached(id: string): Promise<CmsMenu | null> {
  return fetchMenuByIdFromDb(id);
}

export async function getActiveMenuById(id: string): Promise<CmsMenu | null> {
  const menu = await getMenuById(id)();
  if (!menu || !menu.active) return null;
  return menu;
}

export async function createMenu(data: CmsMenuCreate): Promise<CmsMenu> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const document: CmsMenu = {
    _id: data._id,
    name: data.name,
    location: data.location,
    active: data.active ?? true,
    items: computeItemLevels(data.items ?? []),
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<CmsMenu>("cms_menus").insertOne(document);
  revalidateTag(CMS_MENUS_TAG, "max");
  revalidateTag(`cms-menu-${data._id}`, "max");

  return document;
}

export async function updateMenu(
  id: string,
  data: CmsMenuUpdate
): Promise<CmsMenu | null> {
  const db = await getDatabase();
  const existing = await fetchMenuByIdFromDb(id);

  if (!existing) return null;

  const now = new Date().toISOString();
  const document: CmsMenu = {
    _id: id,
    name: data.name,
    location: data.location,
    active: data.active,
    items: computeItemLevels(data.items ?? []),
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  await db.collection<CmsMenu>("cms_menus").replaceOne({ _id: id }, document);
  revalidateTag(CMS_MENUS_TAG, "max");
  revalidateTag(`cms-menu-${id}`, "max");

  return document;
}

export async function deleteMenu(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.collection<CmsMenu>("cms_menus").deleteOne({ _id: id });

  if (result.deletedCount > 0) {
    revalidateTag(CMS_MENUS_TAG, "max");
    revalidateTag(`cms-menu-${id}`, "max");
    return true;
  }

  return false;
}

export async function duplicateMenu(
  sourceId: string,
  newId: string,
  newName: string
): Promise<CmsMenu | null> {
  const source = await fetchMenuByIdFromDb(sourceId);
  if (!source) return null;

  return createMenu({
    _id: newId,
    name: newName,
    location: source.location,
    active: false,
    items: source.items.map((item) => ({ ...item })),
  });
}

export async function menuExists(id: string): Promise<boolean> {
  const db = await getDatabase();
  const count = await db.collection<CmsMenu>("cms_menus").countDocuments({ _id: id });
  return count > 0;
}
