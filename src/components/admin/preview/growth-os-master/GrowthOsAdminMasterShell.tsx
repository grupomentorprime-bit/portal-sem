"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Globe,
  Handshake,
  Home,
  LogOut,
  Megaphone,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { ProductMark } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { cn } from "@/lib/utils";
import {
  GROWTH_OS_MASTER_NAV,
  type MasterNavIcon,
  type MasterNavItem,
} from "./master-nav";

const NAV_ICONS: Record<MasterNavIcon, LucideIcon> = {
  home: Home,
  people: Users,
  sales: Handshake,
  messages: MessageCircle,
  activity: Activity,
  campaigns: Megaphone,
  automations: Workflow,
  analytics: BarChart3,
  site: Globe,
  team: UsersRound,
  settings: Settings,
};

export interface GrowthOsAdminMasterShellProps {
  children: ReactNode;
  userName: string;
  roleLabel: string;
  spaceName: string;
  spaceLogoUrl?: string;
  spaceShortName?: string;
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

export function GrowthOsAdminMasterShell({
  children,
  userName,
  roleLabel,
  spaceName,
  spaceLogoUrl,
  spaceShortName,
}: GrowthOsAdminMasterShellProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const spaceInitial =
    (spaceShortName || spaceName).trim().charAt(0).toUpperCase() || "E";

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    const href = q
      ? `/admin/personas?q=${encodeURIComponent(q)}`
      : "/admin/personas";
    router.push(href);
  }

  return (
    <div
      className="min-h-screen bg-[var(--gray-50)] text-foreground"
      data-ot="OT-GROWTH-UX-ADMIN-MASTER-001A"
    >
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-30 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[var(--color-border-default)] bg-white lg:flex">
          <div className="px-4 pb-4 pt-5">
            <Link
              href="/dev-preview/admin-master"
              className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
            >
              <GrowthOsMark />
              <ProductMark size="md" className="min-w-0 [&_span]:text-[var(--gray-900)]" />
            </Link>
          </div>

          <div className="px-3 pb-4">
            <div className="flex min-w-0 items-center gap-2.5 rounded-[12px] border border-[var(--color-border-default)] border-l-2 border-l-[color-mix(in_srgb,var(--brand-primary)_55%,var(--color-border-default))] bg-[var(--gray-50)] px-2.5 py-2">
              {spaceLogoUrl?.trim() ? (
                <img
                  src={spaceLogoUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-md bg-white object-contain p-0.5"
                />
              ) : (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold text-[var(--growth-os-primary)]"
                  aria-hidden
                >
                  {spaceInitial}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--gray-500)]">
                  Espacio activo
                </p>
                <p className="truncate text-[12px] font-semibold leading-tight text-[var(--gray-900)]">
                  {spaceName}
                </p>
              </div>
            </div>
          </div>

          <nav
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 pb-3"
            aria-label={`${PLATFORM_DISPLAY_NAME} · Espacio`}
          >
            <div className="flex flex-col gap-0.5">
              {GROWTH_OS_MASTER_NAV.primary.map((item) => (
                <MasterNavLink key={item.id} item={item} active={item.id === "inicio"} />
              ))}
            </div>

            <div>
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gray-500)]">
                {GROWTH_OS_MASTER_NAV.grow.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {GROWTH_OS_MASTER_NAV.grow.items.map((item) => (
                  <MasterNavLink key={item.id} item={item} nested />
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-0.5 border-t border-[var(--color-border-default)] pt-3">
              {GROWTH_OS_MASTER_NAV.tools.map((item) => (
                <MasterNavLink key={item.id} item={item} />
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-default)] bg-white/95 backdrop-blur">
            <div className="flex h-[56px] items-center gap-3 px-4 sm:px-5 lg:px-6">
              <div className="min-w-0 lg:hidden">
                <Link
                  href="/dev-preview/admin-master"
                  className="inline-flex min-w-0 items-center gap-2"
                >
                  <GrowthOsMark className="h-8 w-8 rounded-[10px]" />
                  <span className="truncate text-sm font-bold text-[var(--gray-900)]">
                    {PLATFORM_DISPLAY_NAME}
                  </span>
                </Link>
              </div>

              <form
                onSubmit={onSearchSubmit}
                className="relative hidden min-w-0 flex-1 md:block"
                role="search"
                aria-label="Buscar personas"
              >
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-500)]"
                  aria-hidden
                />
                <input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar personas…"
                  className="h-10 w-full max-w-[640px] rounded-[12px] border border-[var(--color-border-default)] bg-[var(--gray-50)] pl-10 pr-3 text-[13px] text-[var(--gray-800)] outline-none transition placeholder:text-[var(--gray-500)] focus:border-[var(--growth-os-secondary)] focus:bg-white focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--growth-os-secondary)_18%,transparent)]"
                  aria-label="Buscar personas"
                  title="Busca solo en Personas"
                />
              </form>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full border border-[var(--color-border-default)] bg-[var(--gray-50)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--gray-500)] sm:inline">
                  Maqueta
                </span>
                <div className="inline-flex items-center gap-2 rounded-[12px] py-0.5 pl-0.5 pr-2">
                  <AdminUserAvatar name={userName} size="sm" />
                  <span className="hidden min-w-0 text-left sm:block">
                    <span className="block max-w-[12rem] truncate text-[13px] font-semibold tracking-tight text-[var(--gray-900)] lg:max-w-[16rem]">
                      {userName}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--gray-500)]">
                      {roleLabel}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--gray-500)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]"
                  aria-label="Salir"
                  onClick={async () => {
                    await fetch("/api/identity/logout", { method: "POST" });
                    window.location.assign("/admin/login");
                  }}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function MasterNavLink({
  item,
  active = false,
  nested = false,
}: {
  item: MasterNavItem;
  active?: boolean;
  nested?: boolean;
}) {
  const Icon = NAV_ICONS[item.icon];
  const href = item.href;
  const className = cn(
    "relative inline-flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13px] font-medium transition",
    nested && "py-1.5 pl-4 text-[12.5px] font-medium text-[var(--gray-700)]",
    active
      ? "bg-[var(--gray-100)] text-[var(--growth-os-primary)]"
      : href
        ? "text-[var(--gray-800)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]"
        : "cursor-default text-[var(--gray-800)]"
  );

  const inner = (
    <>
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--growth-os-primary)]"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-[9px]",
          nested && "h-6 w-6 rounded-[8px]",
          active
            ? "bg-white text-[var(--growth-os-primary)] shadow-[0_1px_2px_rgba(14,79,144,0.08)]"
            : "text-[var(--gray-500)]"
        )}
      >
        <Icon className={nested ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      </span>
      {item.label}
    </>
  );

  if (href == null) {
    return (
      <span
        className={className}
        title="Dirección visual — este módulo aún no existe"
      >
        {inner}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}
