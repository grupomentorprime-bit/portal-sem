import { getSiteConfig } from "@/lib/cms/config";
import { getActiveMenuById } from "@/lib/cms/menus";
import { resolveBrandingAssets } from "@/core/branding";
import { NAV_MENU_IDS, resolveNavigation } from "@/core/navigation";
import type { ResolvedNavigation } from "@/core/navigation";
import type { ResolvedBrandingAssets } from "@/core/branding";
import type { SiteConfig } from "@/types/cms";

export interface TenantContext {
  config: SiteConfig;
  tenantId: string;
  branding: ResolvedBrandingAssets;
  navigation: ResolvedNavigation;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const config = await getSiteConfig();
  if (!config?.institution.tenant) return null;

  const tenantId = config.institution.tenant;

  const [headerMenu, footerMenu, mobileMenu, legalMenu, quickLinksMenu] =
    await Promise.all([
      getActiveMenuById(NAV_MENU_IDS.header, tenantId),
      getActiveMenuById(NAV_MENU_IDS.footer, tenantId),
      getActiveMenuById(NAV_MENU_IDS.mobile, tenantId),
      getActiveMenuById(NAV_MENU_IDS.legal, tenantId),
      getActiveMenuById(NAV_MENU_IDS.quickLinks, tenantId),
    ]);

  return {
    config,
    tenantId,
    branding: await resolveBrandingAssets({ config }),
    navigation: resolveNavigation({
      header: headerMenu?.items,
      footer: footerMenu?.items,
      mobile: mobileMenu?.items,
      legal: legalMenu?.items,
      quickLinks: quickLinksMenu?.items,
    }, config.features),
  };
}

export async function getActiveTenantContext(): Promise<TenantContext | null> {
  const ctx = await getTenantContext();
  if (!ctx || ctx.config.institution.status !== "active") return null;
  return ctx;
}
