/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalFooter
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

import Link from "next/link";
import { NavMenu } from "@/components/navigation/NavMenu";
import type { CmsMenu } from "@/types/menu";
import type { SiteConfig } from "@/types/cms";

interface SiteFooterProps {
  config: SiteConfig | null;
  footerMenu: CmsMenu | null;
}

export function SiteFooter({ config, footerMenu }: SiteFooterProps) {
  const institution = config?.institution;
  const branding = config?.branding;

  return (
    <footer
      className="mt-auto border-t border-border dark:border-gray-700"
      style={{
        backgroundColor: branding?.backgroundColor,
        color: branding?.textColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{institution?.name}</p>
            <p className="mt-1 text-sm opacity-70">{institution?.organization}</p>
          </div>

          {footerMenu ? (
            <NavMenu items={footerMenu.items} variant="footer" />
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs opacity-50">
          © {new Date().getFullYear()} {institution?.name}.{" "}
          <Link href="/admin/menus" className="underline">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
