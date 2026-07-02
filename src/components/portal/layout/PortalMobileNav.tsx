"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { iconSizes } from "@/design";
import { focusRing } from "@/components/ui/shared";
import { isHomeHref, useHomeLinkHandler } from "@/lib/navigation/home";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./PortalHeader";

interface PortalMobileNavProps {
  open: boolean;
  onClose: () => void;
  links: NavLinkItem[];
  loginHref?: string;
  loginLabel?: string;
  applyHref?: string;
  applyLabel?: string;
}

export function PortalMobileNav({
  open,
  onClose,
  links,
  loginHref,
  loginLabel = "Ingresar",
  applyHref,
  applyLabel = "Postular ahora",
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
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link
                  href={link.href}
                  className="block rounded-[var(--radius-md)] px-3 py-3 text-body font-medium text-foreground hover:bg-background-soft"
                  onClick={(event) => {
                    if (isHomeHref(link.href)) {
                      handleHomeLink(event, link.href);
                    }
                    onClose();
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {(loginHref || applyHref) ? (
          <div className="space-y-2 border-t border-border p-4">
            {loginHref ? (
              <Link
                href={loginHref}
                className={cn("portal-btn-login w-full justify-center", focusRing)}
                onClick={onClose}
              >
                {loginLabel}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
