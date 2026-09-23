"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { X } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { isHomeHref, useHomeLinkHandler } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./PortalHeader";

function MobileNavTree({
  links,
  depth,
  onClose,
  onHome,
}: {
  links: NavLinkItem[];
  depth: number;
  onClose: () => void;
  onHome: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1"}>
      {links.map((link) => {
        const children = (link.children ?? []).filter((child) => child.href && child.href !== "#");
        return (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="block rounded-[var(--radius-md)] py-3 text-body font-medium text-foreground hover:bg-background-soft"
              style={{ paddingLeft: `${0.75 + depth * 0.75}rem`, paddingRight: "0.75rem" }}
              onClick={(event) => {
                if (isHomeHref(link.href)) onHome(event, link.href);
                onClose();
              }}
            >
              {link.label}
            </Link>
            {children.length > 0 ? (
              <MobileNavTree links={children} depth={depth + 1} onClose={onClose} onHome={onHome} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

interface PortalMobileNavProps {
  open: boolean;
  onClose: () => void;
  links: NavLinkItem[];
  loginHref?: string;
  loginLabel?: string;
  applyHref?: string;
  applyLabel?: string;
  campusHref?: string;
  campusLabel?: string;
}

export function PortalMobileNav({
  open,
  onClose,
  links,
  loginHref,
  loginLabel = "Ingresar",
  applyHref,
  applyLabel = "Postular ahora",
  campusHref,
  campusLabel = "Campus",
}: PortalMobileNavProps) {
  const handleHomeLink = useHomeLinkHandler();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm"
        aria-label="Cerrar menú"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-[var(--shadow-xl)]">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-sm font-semibold text-foreground">Menú</span>
          <button
            type="button"
            onClick={onClose}
            className={cn("rounded-[var(--radius-md)] p-2", focusRing)}
            aria-label="Cerrar"
          >
            <X size={iconSizes.lg} strokeWidth={2} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Menú móvil">
          <MobileNavTree links={links} depth={0} onClose={onClose} onHome={handleHomeLink} />
        </nav>
        {(loginHref || applyHref || campusHref) ? (
          <div className="space-y-2 border-t border-border p-4">
            {campusHref ? (
              <Link
                href={campusHref}
                className={cn("portal-btn-campus w-full", focusRing)}
                onClick={onClose}
              >
                {campusLabel}
              </Link>
            ) : null}
            {applyHref ? (
              <Link
                href={applyHref}
                className={cn("portal-btn-apply w-full", focusRing)}
                onClick={onClose}
              >
                {applyLabel}
              </Link>
            ) : null}
            {loginHref ? (
              <Link
                href={loginHref}
                className={cn("portal-btn-login portal-btn-login--quiet w-full justify-center", focusRing)}
                onClick={onClose}
              >
                {loginLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
