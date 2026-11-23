import { SPECIALIZED_APPS, type SpecializedAppId } from "@/nelzuri/catalog/manifests";
import { manifestById } from "@/nelzuri/catalog/registry";

function pathWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Qué capacidad especializada declara esta ruta interna.
 * Solo lee el catálogo. No conoce el shell ni los permisos de Growth OS.
 */
export function specializedAppForInternalPath(pathname: string): SpecializedAppId | null {
  const path = pathname.trim();
  if (!path) return null;
  let found: { id: SpecializedAppId; length: number } | null = null;
  for (const id of SPECIALIZED_APPS) {
    const open = manifestById(id).open;
    if (open.type !== "internal") continue;
    if (!pathWithin(path, open.href)) continue;
    if (!found || open.href.length > found.length) found = { id, length: open.href.length };
  }
  return found?.id ?? null;
}
