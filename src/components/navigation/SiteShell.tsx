/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalShell
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import { NavbarPremium, InstitutionalFooter } from "@/components/institutional";
import { getActiveMenuById } from "@/lib/cms/menus";
import { getSiteConfig } from "@/lib/cms/config";
import type { NavLinkItem } from "@/components/institutional";
import { DEFAULT_NAV_LINKS } from "@/lib/cms/page-defaults";
import { resolveMenuItemHref } from "@/lib/cms/menu-utils";
import type { MenuItem } from "@/types/menu";

interface SiteShellProps {
  children: React.ReactNode;
}

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

export async function SiteShell({ children }: SiteShellProps) {
  const [config, mainMenu] = await Promise.all([
    getSiteConfig(),
    getActiveMenuById("main"),
  ]);

  const navLinks = mainMenu?.items?.length
    ? mapMenuToLinks(mainMenu.items)
    : [...DEFAULT_NAV_LINKS];

  return (
    <>
      <NavbarPremium
        links={navLinks}
        institutionShortName={config?.institution.shortName || ""}
        logoSem={config?.branding.logo || undefined}
        logoIpn={undefined}
      />
      <main className="flex-1">{children}</main>
      <InstitutionalFooter
        institutionName={config?.institution.name || "Institución"}
        organization={config?.institution.organization}
        contact={config?.contact}
        social={config?.social}
        logoSem={config?.branding.logo || undefined}
      />
    </>
  );
}
