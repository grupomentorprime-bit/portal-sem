"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { iconSizes } from "@/design";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/ui/shared";
import { PortalBrandMark } from "@/components/portal/PortalBrandMark";
import { useHomeLinkHandler } from "@/lib/navigation/home";
import { PortalMobileNav } from "./PortalMobileNav";

export interface NavLinkItem {
  label: string;
  href: string;
}

interface PortalHeaderProps {
  links: NavLinkItem[];
  mobileLinks?: NavLinkItem[];
  logoPrimary?: string;
  logoSecondary?: string;
  institutionName?: string;
  institutionShortName?: string;
  organization?: string;
  loginHref?: string;
  loginLabel?: string;
  applyHref?: string;
  applyLabel?: string;
  variant?: "default" | "premium";
  searchHref?: string;
}

function isActiveNav(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function stripTrailingArrow(label: string): string {
  return label.replace(/\s*(?:→|->)\s*$/u, "").trimEnd();
}

export function PortalHeader({
  links,
  mobileLinks,
  logoPrimary,
  logoSecondary,
  institutionName = "",
  institutionShortName = "",
  organization = "",
  loginHref,
  loginLabel = "Ingresar",
  applyHref,
  applyLabel = "Postular ahora",
  variant = "default",
  searchHref = "/buscar",
}: PortalHeaderProps) {
  const pathname = usePathname();
  const handleHomeLink = useHomeLinkHandler();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPremium = variant === "premium";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
  const drawerLinks = mobileLinks ?? links;
  const homeLink = links.find((l) => l.href === "/");

  return (
    <>
      <header
        className={cn(
          "portal-header-premium fixed inset-x-0 top-0 z-[var(--z-sticky)] border-b",
          isPremium && "portal-header-premium--hero",
          scrolled && "portal-header-premium--scrolled"
        )}
      >
        <div
          className={cn(
            "portal-header-premium__inner mx-auto w-full",
            !isPremium && "max-w-[1400px] px-4 sm:px-6 lg:px-8"
          )}
        >
          <div className="portal-header-premium__grid">
            <Link
              href="/"
              className={cn("portal-header-premium__brand", focusRing)}
              onClick={(event) => handleHomeLink(event, "/")}
              aria-label={
                institutionShortName
                  ? `${institutionShortName} — Inicio`
                  : institutionName
                    ? `${institutionName} — Inicio`
                    : "Inicio"
              }
            >
              <PortalBrandMark
                logoPrimary={logoPrimary}
                institutionName={institutionName}
                institutionShortName={institutionShortName}
                variant="light"
                layout={isPremium ? "premium-hero" : "default"}
              />
            </Link>

            <nav
              className="portal-header-premium__nav hidden lg:flex"
              aria-label="Navegación principal"
            >
              {homeLink ? (
                <Link
                  href={homeLink.href}
                  className={cn(
                    "portal-nav-link",
                    isActiveNav(pathname, homeLink.href) && "portal-nav-link--active",
                    focusRing
                  )}
                  onClick={(event) => handleHomeLink(event, homeLink.href)}
                >
                  {homeLink.label}
                </Link>
              ) : null}
              {navLinks.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={cn(
                    "portal-nav-link",
                    isActiveNav(pathname, link.href) && "portal-nav-link--active",
                    focusRing
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="portal-header-premium__actions hidden lg:flex">
              <Link
                href={searchHref}
                className={cn("portal-header-premium__search", focusRing)}
                aria-label="Buscar en el sitio"
              >
                <Search size={18} strokeWidth={2} />
              </Link>
              {loginHref ? (
                <Link href={loginHref} className={cn("portal-btn-login portal-btn-login--hero", focusRing)}>
                  <LogIn size={16} strokeWidth={2} aria-hidden />
                  {loginLabel}
                </Link>
              ) : null}
              {applyHref ? (
                <Link href={applyHref} className={cn("portal-btn-apply portal-btn-apply--header", focusRing)} data-cursor-magnet>
                  {stripTrailingArrow(applyLabel)}
                  <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
                </Link>
              ) : null}
            </div>

            <button
              type="button"
              className={cn("portal-header-premium__menu lg:hidden", focusRing)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={iconSizes.lg} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      <PortalMobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={drawerLinks}
        loginHref={loginHref}
        loginLabel={loginLabel}
        applyHref={applyHref}
        applyLabel={applyLabel}
      />
    </>
  );
}
