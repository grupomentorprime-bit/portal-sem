/**
 * @deprecated
 *
 * Reemplazado por:
 * PortalHeader
 *
 * Eliminación prevista:
 * Core UI v2.0
 *
 * @see docs/frontend/CORE-UI-CANON.md
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { NavMenu } from "@/components/navigation/NavMenu";
import type { CmsMenu } from "@/types/menu";
import type { SiteConfig } from "@/types/cms";

interface SiteHeaderProps {
  config: SiteConfig | null;
  mainMenu: CmsMenu | null;
  mobileMenu: CmsMenu | null;
}

export function SiteHeader({ config, mainMenu, mobileMenu }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const branding = config?.branding;
  const institution = config?.institution;

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
      style={{
        borderColor: branding ? `${branding.primaryColor}22` : undefined,
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          {branding?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo} alt={institution?.shortName ?? ""} className="h-8 w-auto" />
          ) : (
            <span
              className="text-lg font-semibold"
              style={{ color: branding?.primaryColor }}
            >
              {institution?.shortName ?? "Portal"}
            </span>
          )}
        </Link>

        {mainMenu ? <NavMenu items={mainMenu.items} variant="header" /> : null}

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menú"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && mobileMenu ? (
        <div className="border-t border-border px-4 py-4 md:hidden dark:border-gray-700">
          <NavMenu items={mobileMenu.items} variant="mobile" />
        </div>
      ) : null}
    </header>
  );
}
