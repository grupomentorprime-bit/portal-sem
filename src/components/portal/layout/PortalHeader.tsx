"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { PortalMobileNav } from "./PortalMobileNav";

export interface NavLinkItem {
  label: string;
  href: string;
}

interface PortalHeaderProps {
  links: NavLinkItem[];
  logoSem: string;
  logoIpn?: string;
  institutionShortName?: string;
  applyHref?: string;
  campusHref?: string;
}

export function PortalHeader({
  links,
  logoSem,
  logoIpn,
  institutionShortName = "SEM",
  applyHref = "/contacto",
  campusHref = "https://campus.aprendehoy.cl",
}: PortalHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = links.filter((l) => l.href !== "/");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[var(--z-sticky)] transition-all duration-[var(--transition-normal)]",
          scrolled
            ? "border-b border-border bg-background/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
            : "bg-primary/90 backdrop-blur-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
          <Link
            href="/"
            className={cn("flex shrink-0 items-center gap-3", focusRing, "rounded-[var(--radius-sm)]")}
            aria-label={`${institutionShortName} — Inicio`}
          >
            {logoIpn ? (
              <>
                <Image
                  src={logoIpn}
                  alt="Instituto Patrístico Nacional"
                  width={36}
                  height={36}
                  className="h-8 w-auto brightness-0 invert sm:h-9"
                />
                <span
                  className={cn("hidden h-7 w-px sm:block", scrolled ? "bg-border" : "bg-text-inverse/25")}
                  aria-hidden
                />
              </>
            ) : null}
            <Image
              src={logoSem}
              alt="Logo institucional"
              width={36}
              height={36}
              className={cn("h-8 w-auto sm:h-9", !scrolled && "brightness-0 invert")}
            />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                  focusRing,
                  scrolled
                    ? "text-foreground hover:text-secondary"
                    : "text-text-inverse/90 hover:text-text-inverse"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button
              href={campusHref}
              variant={scrolled ? "outline" : "ghost"}
              size="sm"
              className={!scrolled ? "border-text-inverse/30 text-text-inverse hover:bg-text-inverse/10" : undefined}
            >
              Aula virtual
            </Button>
            <Button href={applyHref} variant="secondary" size="sm">
              Postula ahora
            </Button>
          </div>

          <button
            type="button"
            className={cn(
              "rounded-[var(--radius-md)] p-2 xl:hidden",
              focusRing,
              scrolled ? "text-foreground" : "text-text-inverse"
            )}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={iconSizes.lg} strokeWidth={2} />
          </button>
        </div>
      </header>

      <PortalMobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={links}
        applyHref={applyHref}
        campusHref={campusHref}
      />
    </>
  );
}
