"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
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
        <aside className="sticky top-0 z-30 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-white lg:flex">
          <div className="px-4 pb-5 pt-5">
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
                  Administración de plataforma
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
              icon={<LayoutDashboard className="h-4 w-4" aria-hidden />}
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

          <div className="mt-auto space-y-2 px-3 pb-4 pt-3">
            <div className="rounded-[14px] border border-[var(--color-border-default)] bg-[linear-gradient(165deg,var(--gray-100)_0%,var(--gray-50)_48%,white_100%)] px-3.5 py-3 shadow-[0_8px_20px_-16px_rgba(14,79,144,0.35)]">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--growth-os-light)_24%,white)] text-[var(--growth-os-light)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
              </div>
              <p className="text-[13px] font-semibold text-[var(--gray-900)]">
                {PLATFORM_DISPLAY_NAME}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-[var(--gray-500)]">
                Potenciando organizaciones que generan impacto.
              </p>
              <Link
                href="/admin"
                className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--growth-os-primary)] transition hover:opacity-80"
              >
                Ir al Espacio
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-default)] bg-white/95 backdrop-blur">
            <div className="flex h-[56px] items-center gap-3 px-4 sm:px-5 lg:px-6">
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
                      Administración de plataforma
                    </span>
                  </span>
                </Link>
              </div>

              <form
                onSubmit={onSearchSubmit}
                className="relative hidden min-w-0 flex-1 md:block"
                role="search"
              >
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-500)]"
                  aria-hidden
                />
                <input
                  type="search"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="Buscar espacios, dominios, personas…"
                  className="h-10 w-full max-w-[760px] rounded-[12px] border border-[var(--color-border-default)] bg-[var(--color-background-default)] pl-10 pr-14 text-[13px] text-[var(--gray-800)] outline-none transition placeholder:text-[var(--gray-500)] focus:border-[var(--growth-os-secondary)] focus:bg-white focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--growth-os-secondary)_18%,transparent)]"
                  aria-label="Buscar en la plataforma"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--color-border-default)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--gray-500)] sm:inline-block">
                  ⌘ K
                </kbd>
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

              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-[12px] py-0.5 pl-0.5 pr-2 transition hover:bg-[var(--color-background-default)]"
                  aria-label="Cuenta"
                >
                  <AdminUserAvatar name={userName} size="sm" />
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-[11rem] truncate text-[13px] font-semibold tracking-tight text-[var(--gray-900)] lg:max-w-[18rem]">
                      {userName}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--gray-500)]">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronDown
                    className="hidden h-3.5 w-3.5 text-[var(--gray-500)] sm:block"
                    aria-hidden
                  />
                </button>
                <LogoutControl />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-none flex-1 px-4 py-5 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
            {children}
          </main>

          <footer className="mt-auto border-t border-[var(--color-border-default)] bg-white">
            <div className="mx-auto flex w-full max-w-none flex-col gap-1 px-4 py-2.5 text-[12px] text-[var(--gray-500)] sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
              <p>
                {PLATFORM_DISPLAY_NAME}{" "}
                <span className="text-[var(--gray-400)]">|</span> Simple por
                fuera. Potente por dentro.
              </p>
              <p className="sm:text-right">Administración de plataforma</p>
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
        "relative inline-flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[13px] font-medium transition",
        active
          ? "bg-[var(--gray-100)] text-[var(--growth-os-primary)]"
          : "text-[var(--gray-800)] hover:bg-[var(--color-background-default)] hover:text-[var(--gray-900)]"
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--growth-os-primary)]"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-[9px]",
          active
            ? "bg-white text-[var(--growth-os-primary)] shadow-[0_1px_2px_rgba(14,79,144,0.08)]"
            : "text-[var(--gray-500)]"
        )}
      >
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--gray-500)] transition hover:bg-[var(--color-background-default)] hover:text-[var(--gray-900)]"
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
