"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";
import { focusRing } from "@/components/ui/shared";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./PortalHeader";

interface PortalMobileNavProps {
  open: boolean;
  onClose: () => void;
  links: NavLinkItem[];
  applyHref?: string;
  applyLabel?: string;
  campusHref?: string;
  campusLabel?: string;
}

export function PortalMobileNav({
  open,
  onClose,
  links,
  applyHref,
  applyLabel = "Postular",
  campusHref,
  campusLabel = "Aula virtual",
}: PortalMobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] xl:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
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
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {(campusHref || applyHref) ? (
          <div className="space-y-2 border-t border-border p-4">
            {campusHref ? (
              <Button href={campusHref} variant="outline" className="w-full" onClick={onClose}>
                {campusLabel}
              </Button>
            ) : null}
            {applyHref ? (
              <Button href={applyHref} variant="primary" className="w-full" onClick={onClose}>
                {applyLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
