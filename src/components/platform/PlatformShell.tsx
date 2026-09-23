"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CircleHelp,
  Home,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { PLATFORM_OPERATOR_NAME } from "@/core/legal/platform";
import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { PlatformNeutralTheme } from "@/components/product";
import { cn } from "@/lib/utils";

const PLATFORM_SEARCH_EVENT = "platform:spaces-search";

export function dispatchPlatformSpacesSearch(query: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PLATFORM_SEARCH_EVENT, { detail: { query } })
  );
}

export function subscribePlatformSpacesSearch(
  handler: (query: string) => void
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ query?: string }>).detail;
    handler(typeof detail?.query === "string" ? detail.query : "");
  };
  window.addEventListener(PLATFORM_SEARCH_EVENT, listener);
  return () => window.removeEventListener(PLATFORM_SEARCH_EVENT, listener);
}

function GrowthOsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[var(--growth-os-primary)] to-[var(--growth-os-secondary)] shadow-[0_8px_18px_-10px_rgba(14,79,144,0.55)]",
        className
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,color-mix(in_srgb,white_42%,transparent),transparent_58%)]" />
      <Sparkles className="relative h-4 w-4 text-white" strokeWidth={2.25} />
    </span>
  );
}

export function PlatformShell({
  children,
  userName,
  roleLabel,
}: {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [globalQuery, setGlobalQuery] = useState("");
  const onHome =
    pathname === PLATFORM_ADMIN_HOME || pathname === `${PLATFORM_ADMIN_HOME}/`;
  const onSpacesDetail = pathname.startsWith(`${PLATFORM_ADMIN_HOME}/spaces/`);

  const runGlobalSearch = useCallback(
    (raw: string) => {
      const query = raw.trim();
      if (onHome) {
        dispatchPlatformSpacesSearch(query);
        const el = document.getElementById("espacios");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const qs = params.toString();
      router.push(`${PLATFORM_ADMIN_HOME}${qs ? `?${qs}` : ""}#espacios`);
    },
    [onHome, router]
  );

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runGlobalSearch(globalQuery);
  }

  return (
    <PlatformNeutralTheme className="min-h-screen bg-[var(--color-background-default)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-30 hidden h-screen w-[220px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-white lg:flex">
          <div className="px-3.5 pb-4 pt-4">
            <Link
              href={PLATFORM_ADMIN_HOME}
              className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
            >
              <GrowthOsMark />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-tight tracking-[-0.03em] text-[var(--gray-900)]">
                  {PLATFORM_DISPLAY_NAME}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--gray-500)]">
                  Operada por {PLATFORM_OPERATOR_NAME}
                </span>
              </span>
            </Link>
          </div>

          <nav
            className="flex flex-1 flex-col gap-1 px-2.5"
            aria-label={`${PLATFORM_DISPLAY_NAME} plataforma`}
          >
            <SidebarLink
              href={PLATFORM_ADMIN_HOME}
              active={onHome}
              icon={<Home className="h-4 w-4" aria-hidden />}
            >
              Resumen
            </SidebarLink>
            <SidebarLink
              href={`${PLATFORM_ADMIN_HOME}#espacios`}
              active={onSpacesDetail}
              icon={<Building2 className="h-4 w-4" aria-hidden />}
            >
              Espacios
            </SidebarLink>
          </nav>

          <div className="mt-auto px-2.5 pb-3 pt-2">
            <div className="overflow-hidden rounded-2xl bg-[linear-gradient(165deg,#08315f_0%,var(--growth-os-primary)_100%)] px-3.5 py-3.5">
              <p className="text-[13px] font-semibold text-white">
                {PLATFORM_DISPLAY_NAME}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-white/75">
                Multiplica impacto sin diluir la identidad de cada organización.
              </p>
              <Link
                href="/admin"
                aria-label="Ir al Espacio"
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/35 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-white/10"
              >
                Ver más
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-default)] bg-white/90 backdrop-blur">
            <div className="flex h-12 items-center gap-3 px-4 sm:px-5 lg:px-5">
              <div className="min-w-0 lg:hidden">
                <Link
                  href={PLATFORM_ADMIN_HOME}
                  className="inline-flex min-w-0 items-center gap-2"
                >
                  <GrowthOsMark className="h-8 w-8 rounded-[10px]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[var(--gray-900)]">
                      {PLATFORM_DISPLAY_NAME}
                    </span>
                    <span className="block truncate text-[11px] text-[var(--gray-500)]">
                      Operada por {PLATFORM_OPERATOR_NAME}
                    </span>
                  </span>
                </Link>
              </div>

              <form
                onSubmit={onSearchSubmit}
                className="hidden min-w-0 flex-1 md:block"
                role="search"
              >
                <div className="relative w-full">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-500)]"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Buscar espacios, dominios, personas…"
                    className="h-8 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background-default)] pl-9 pr-12 text-[13px] text-[var(--gray-800)] outline-none transition placeholder:text-[var(--gray-500)] focus:border-[var(--growth-os-secondary)] focus:bg-white focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--growth-os-secondary)_18%,transparent)]"
                    aria-label="Buscar en la plataforma"
                  />
                  <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--color-border-default)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--gray-500)] lg:inline-block">
                    ⌘ K
                  </kbd>
                </div>
              </form>

              <nav
                className="flex min-w-0 items-center gap-3 text-sm md:hidden"
                aria-label="Navegación móvil"
              >
                <Link
                  href={PLATFORM_ADMIN_HOME}
                  className={cn(
                    "font-medium",
                    onHome ? "text-foreground" : "text-muted"
                  )}
                >
                  Resumen
                </Link>
                <Link
                  href={`${PLATFORM_ADMIN_HOME}#espacios`}
                  className="font-medium text-muted"
                >
                  Espacios
                </Link>
              </nav>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <Link
                  href="/admin/settings/help"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-white text-[var(--gray-500)] transition hover:text-[var(--gray-900)]"
                  aria-label="Centro de ayuda"
                >
                  <CircleHelp className="h-4 w-4" aria-hidden />
                </Link>
              <div className="flex shrink-0 items-center rounded-full border border-[var(--color-border-default)] bg-white py-0.5 pl-0.5 pr-0.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2"
                  aria-label="Cuenta"
                >
                  <AdminUserAvatar name={userName} size="sm" />
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-[9rem] truncate text-[13px] font-semibold leading-tight tracking-tight text-[var(--gray-900)] lg:max-w-[14rem]">
                      {userName}
                    </span>
                    <span className="block truncate text-[11px] leading-tight text-[var(--gray-500)]">
                      {roleLabel}
                    </span>
                  </span>
                </button>
                <span
                  className="mx-0.5 hidden h-5 w-px bg-[var(--color-border-default)] sm:block"
                  aria-hidden
                />
                <LogoutControl />
              </div>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-none flex-1 px-4 py-4 sm:px-5 lg:px-5">
            {children}
          </main>

          <footer className="mt-auto border-t border-[var(--color-border-default)] bg-white">
            <div className="mx-auto flex w-full max-w-none flex-col gap-1 px-4 py-2 text-[12px] text-[var(--gray-500)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p>
                {PLATFORM_DISPLAY_NAME}
                <span className="mx-1.5 text-[var(--gray-400)]">·</span>
                Operada por {PLATFORM_OPERATOR_NAME}
              </p>
              <p className="sm:text-right">
                Cada organización en su propia dirección
              </p>
            </div>
          </footer>
        </div>
      </div>
    </PlatformNeutralTheme>
  );
}

function SidebarLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition",
        active
          ? "bg-[color-mix(in_srgb,var(--growth-os-primary)_10%,white)] text-[var(--growth-os-primary)]"
          : "text-[var(--gray-600)] hover:bg-[var(--color-background-default)] hover:text-[var(--gray-900)]"
      )}
    >
      <span className={cn(active ? "text-[var(--growth-os-primary)]" : "text-[var(--gray-500)]")}>
        {icon}
      </span>
      {children}
    </Link>
  );
}

function LogoutControl() {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--gray-500)] transition hover:bg-[var(--color-background-default)] hover:text-[var(--gray-900)]"
      aria-label="Salir"
      onClick={async () => {
        await fetch("/api/identity/logout", { method: "POST" });
        window.location.assign("/admin/login");
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
    </button>
  );
}
