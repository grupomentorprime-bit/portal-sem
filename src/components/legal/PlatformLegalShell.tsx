import { ProductMark, PlatformNeutralTheme } from "@/components/product";
import {
  PLATFORM_LEGAL_LAST_UPDATED,
  PLATFORM_LEGAL_NAV,
  PLATFORM_LEGAL_ROUTES,
  PLATFORM_OPERATOR_NAME,
  PLATFORM_SUPPORT_EMAIL,
} from "@/core/legal/platform";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import Link from "next/link";
import type { ReactNode } from "react";

function formatUpdatedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function PlatformLegalShell({
  children,
  activeHref,
}: {
  children: ReactNode;
  activeHref?: string;
}) {
  const updatedLabel = formatUpdatedDate(PLATFORM_LEGAL_LAST_UPDATED);

  return (
    <PlatformNeutralTheme className="min-h-screen bg-[var(--color-background-default)] text-foreground">
      <div className="relative isolate min-h-screen">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--growth-os-secondary)_14%,transparent),transparent_70%)]"
        />
        <header className="relative border-b border-border/80 bg-[color-mix(in_srgb,var(--color-surface-default)_88%,transparent)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <ProductMark href={PLATFORM_LEGAL_ROUTES.index} size="md" />
                <p className="text-xs text-muted">
                  Plataforma operada por {PLATFORM_OPERATOR_NAME}
                </p>
              </div>
              <p className="text-xs text-muted">
                Actualizado:{" "}
                <time dateTime={PLATFORM_LEGAL_LAST_UPDATED}>{updatedLabel}</time>
              </p>
            </div>
            <nav
              aria-label={`Documentos legales de ${PLATFORM_DISPLAY_NAME}`}
              className="flex flex-wrap gap-2"
            >
              {PLATFORM_LEGAL_NAV.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "rounded-md bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,transparent)] px-3 py-1.5 text-sm font-medium text-[var(--growth-os-primary)]"
                        : "rounded-md px-3 py-1.5 text-sm text-muted transition hover:bg-[var(--gray-100)] hover:text-foreground"
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </main>

        <footer className="relative border-t border-border/80">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:px-6 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {PLATFORM_DISPLAY_NAME} · {PLATFORM_OPERATOR_NAME}
            </p>
            <a
              href={`mailto:${PLATFORM_SUPPORT_EMAIL}`}
              className="font-medium text-[var(--growth-os-primary)] underline-offset-2 hover:underline"
            >
              {PLATFORM_SUPPORT_EMAIL}
            </a>
          </div>
        </footer>
      </div>
    </PlatformNeutralTheme>
  );
}
