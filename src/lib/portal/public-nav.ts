import { resolveNavigation, type NavLink } from "@/core/navigation";
import { isSemTenant } from "@/core/tenant/is-sem";
import { publicPathname } from "@/core/portal/public-cms-path";
import { getDefaultMenusForTenant, SEM_DEFAULT_MENUS } from "@/lib/cms/menu-defaults";
import {
  isWithheldSemPublicHref,
  SEM_CONTACT_PUBLISHED,
} from "@/lib/portal/sem-identity-v7";

/**
 * Menú de respaldo del SEM. El header público lo usa solo cuando
 * el menú CMS publicado no tiene ítems visibles.
 */
export const SEM_PUBLIC_NAV: NavLink[] = resolveNavigation({
  header: SEM_DEFAULT_MENUS.find((menu) => menu._id === "main")?.items ?? [],
}).header;

function isContactPath(path: string): boolean {
  return path === "/contacto" || path.startsWith("/contacto/");
}

function isProgramsPath(path: string): boolean {
  return path === "/programas" || path.startsWith("/programas/");
}

function keepLink(link: NavLink, tenantId: string): NavLink | null {
  const path = publicPathname(link.href);
  const sem = isSemTenant(tenantId);
  if (sem && isWithheldSemPublicHref(path)) return null;
  if (sem && !SEM_CONTACT_PUBLISHED && isContactPath(path)) return null;
  if (sem && isProgramsPath(path)) return null;

  const children = (link.children ?? [])
    .map((child) => keepLink(child, tenantId))
    .filter((child): child is NavLink => child !== null);

  return { ...link, children };
}

/** Oculta contacto sin validar y deja /programas fuera del menú principal del SEM. */
export function applyPublicNavPolicy(links: NavLink[], tenantId: string): NavLink[] {
  return links
    .map((link) => keepLink(link, tenantId))
    .filter((link): link is NavLink => link !== null);
}

export function resolvePublicHeader(published: NavLink[], tenantId: string): NavLink[] {
  const source = published.length > 0 ? published : fallbackHeader(tenantId);
  return applyPublicNavPolicy(source, tenantId);
}

export function resolvePublicMobile(
  publishedMobile: NavLink[],
  publishedHeader: NavLink[],
  tenantId: string
): NavLink[] {
  if (publishedMobile.length > 0) return applyPublicNavPolicy(publishedMobile, tenantId);
  return resolvePublicHeader(publishedHeader, tenantId);
}

function fallbackHeader(tenantId: string): NavLink[] {
  const menu = getDefaultMenusForTenant(tenantId).find((item) => item._id === "main");
  return resolveNavigation({ header: menu?.items ?? [] }).header;
}

/** El botón de campaña sigue a /admision/2027 cuando el enlace guardado aún apunta a /admision. */
export function resolveSemCampaignHref(href: string | undefined): string {
  const path = publicPathname(href);
  if (!href || path === "/admision") return "/admision/2027";
  return href;
}
