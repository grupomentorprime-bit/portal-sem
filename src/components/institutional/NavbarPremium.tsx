"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { iconSizes } from "@/design";
import { Button } from "@/components/ui";
import { CMS_ASSET_PATHS } from "@/lib/cms/asset-paths";
import { DEFAULT_NAV_LINKS } from "@/lib/cms/page-defaults";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";

export interface NavLinkItem {
  label: string;
  href: string;
}

interface NavbarPremiumProps {
  links?: NavLinkItem[];
  loginHref?: string;
  logoSem?: string;
  logoIpn?: string;
  institutionShortName?: string;
}

export function NavbarPremium({
  links = [...DEFAULT_NAV_LINKS],
  loginHref = "/ingresar",
  logoSem,
  logoIpn,
  institutionShortName = "SEM",
}: NavbarPremiumProps) {
  const semLogo = logoSem || CMS_ASSET_PATHS.logoSem;
  const ipnLogo = logoIpn || CMS_ASSET_PATHS.logoIpn;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
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

  const navLinks = links.filter((l) => l.label !== "Ingresar");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-sticky)] transition-all duration-[var(--transition-normal)]",
        scrolled
          ? "border-b border-border bg-background/95 shadow-[var(--shadow-sm)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={cn("flex shrink-0 items-center gap-3", focusRing, "rounded-[var(--radius-sm)]")}
          aria-label={`${institutionShortName} — Inicio`}
        >
          <Image
            src={ipnLogo}
            alt="Instituto Patrístico Nacional"
            width={40}
            height={40}
            className="h-8 w-auto sm:h-10"
          />
          <span
            className={cn(
              "hidden h-8 w-px sm:block",
              scrolled ? "bg-border" : "bg-text-inverse/30"
            )}
            aria-hidden
          />
          <Image
            src={semLogo}
            alt="Seminario Eclesiástico Mayor"
            width={40}
            height={40}
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Navegación principal"
        >
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-2 text-caption font-medium transition-colors sm:text-body",
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

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            href={loginHref}
            variant={scrolled ? "primary" : "secondary"}
            size="sm"
          >
            Ingresar
          </Button>
        </div>

        <button
          type="button"
          className={cn(
            "rounded-[var(--radius-md)] p-2 lg:hidden",
            focusRing,
            scrolled ? "text-foreground" : "text-text-inverse"
          )}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X size={iconSizes.lg} strokeWidth={2} />
          ) : (
            <Menu size={iconSizes.lg} strokeWidth={2} />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6" aria-label="Menú móvil">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="block rounded-[var(--radius-md)] px-3 py-3 text-body font-medium text-foreground hover:bg-background-soft"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Button
                  href={loginHref}
                  variant="primary"
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Ingresar
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
