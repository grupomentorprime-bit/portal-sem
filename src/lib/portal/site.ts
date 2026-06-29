import { getSiteConfig } from "@/lib/cms/config";
import { getActiveMenuById } from "@/lib/cms/menus";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";
import { resolveMenuItemHref } from "@/lib/cms/menu-utils";
import type { SiteConfig } from "@/types/cms";
import type { MenuItem } from "@/types/menu";
import type { NavLinkItem } from "@/components/portal/layout/PortalHeader";

export const PORTAL_DEFAULT_NAV: NavLinkItem[] = [
  { label: "Inicio", href: "/" },
  { label: "Programas", href: "/programas" },
  { label: "Noticias", href: "/noticias" },
  { label: "Eventos", href: "/eventos" },
  { label: "Equipo", href: "/equipo" },
  { label: "IPN Chile", href: "/ipn-chile" },
  { label: "Contacto", href: "/contacto" },
];

function mapMenuToLinks(items: MenuItem[]): NavLinkItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => item.visible && item.active)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      label: item.title,
      href: resolveMenuItemHref(item),
    }))
    .filter((link) => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });
}

export interface PortalContext {
  config: SiteConfig;
  tenant: string;
  navLinks: NavLinkItem[];
  logos: {
    sem: string;
    ipn: string;
    hero: string;
  };
}

export async function getPortalContext(): Promise<PortalContext | null> {
  const [config, mainMenu] = await Promise.all([
    getSiteConfig(),
    getActiveMenuById("main"),
  ]);

  if (!config) return null;

  const navLinks = mainMenu?.items?.length
    ? mapMenuToLinks(mainMenu.items)
    : PORTAL_DEFAULT_NAV;

  return {
    config,
    tenant: config.institution.tenant,
    navLinks,
    logos: {
      sem: config.branding.logo || CMS_ASSET_PATHS.logoSem,
      ipn: CMS_ASSET_PATHS.logoIpn,
      hero: config.branding.heroImage || CMS_ASSET_PATHS.hero,
    },
  };
}

export async function getActivePortal(): Promise<PortalContext | null> {
  const ctx = await getPortalContext();
  if (!ctx || ctx.config.institution.status !== "active") return null;
  return ctx;
}

export async function requireActivePortal(): Promise<PortalContext> {
  const ctx = await getActivePortal();
  if (!ctx) {
    throw new Error("PORTAL_INACTIVE");
  }
  return ctx;
}
