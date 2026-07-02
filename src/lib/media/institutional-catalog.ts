import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  InstitutionalPhotoAsset,
  InstitutionalPhotoCatalog,
  InstitutionalPhotoCategory,
  InstitutionalPhotoStatus,
} from "@/types/institutional-photo";

const CATALOG_PATH = join(process.cwd(), "public", "media", "catalog.json");

let cachedCatalog: InstitutionalPhotoCatalog | null = null;

export async function loadInstitutionalPhotoCatalog(): Promise<InstitutionalPhotoCatalog> {
  if (cachedCatalog) return cachedCatalog;
  const raw = await readFile(CATALOG_PATH, "utf8");
  cachedCatalog = JSON.parse(raw) as InstitutionalPhotoCatalog;
  return cachedCatalog;
}

export async function getInstitutionalPhotoById(
  id: string
): Promise<InstitutionalPhotoAsset | undefined> {
  const catalog = await loadInstitutionalPhotoCatalog();
  return catalog.assets.find((asset) => asset.id === id);
}

export async function getInstitutionalPhotosByCategory(
  category: InstitutionalPhotoCategory,
  options?: { status?: InstitutionalPhotoStatus[] }
): Promise<InstitutionalPhotoAsset[]> {
  const catalog = await loadInstitutionalPhotoCatalog();
  const allowed = options?.status;
  return catalog.assets.filter(
    (asset) =>
      asset.category === category &&
      (!allowed || allowed.includes(asset.status))
  );
}

export async function getInstitutionalPhotosForSection(
  section: string,
  options?: { status?: InstitutionalPhotoStatus[] }
): Promise<InstitutionalPhotoAsset[]> {
  const catalog = await loadInstitutionalPhotoCatalog();
  const allowed = options?.status ?? ["approved", "provisional"];
  return catalog.assets.filter(
    (asset) =>
      allowed.includes(asset.status) &&
      asset.recommended_section.includes(section as InstitutionalPhotoAsset["recommended_section"][number])
  );
}
