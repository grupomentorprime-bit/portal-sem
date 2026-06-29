"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout";
import { Button } from "./button";
import { focusRing } from "./shared";

export interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  logo?: React.ReactNode;
  links: NavLink[];
  cta?: { label: string; href: string };
  className?: string;
}

export function Navbar({ logo, links, cta, className }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] border-b border-border bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            {logo ?? (
              <Link href="/" className="text-lg font-bold text-primary">
                SEM
              </Link>
            )}
            <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted transition-colors hover:text-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {cta ? (
              <Button href={cta.href} variant="primary" size="sm">
                {cta.label}
              </Button>
            ) : null}
          </div>

          <button
            type="button"
            className={cn("md:hidden", focusRing)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-foreground" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6 text-foreground" strokeWidth={2} />
            )}
          </button>
        </div>

        {mobileOpen ? (
          <nav
            className="border-t border-border py-4 md:hidden animate-slide-up"
            aria-label="Menú móvil"
          >
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-foreground hover:bg-background-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {cta ? (
                <li className="pt-2">
                  <Button
                    href={cta.href}
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cta.label}
                  </Button>
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </Container>
    </header>
  );
}
