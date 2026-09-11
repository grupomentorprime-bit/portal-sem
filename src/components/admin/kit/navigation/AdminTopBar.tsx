"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminStatusBadges } from "@/components/admin/AdminStatusBadges";
import { AdminUserMenuPanel } from "@/components/admin/AdminUserMenuPanel";
import { NotificationBell } from "@/components/admin/notifications/NotificationBell";
import { ProductMark } from "@/components/product";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";

export interface AdminTopBarProps extends AdminShellContext {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

/**
 * Topbar patrón maestro — buscador limitado a Personas (sin búsqueda global).
 */
export function AdminTopBar({
  user,
  compatMode,
  collapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: AdminTopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    const href = q
      ? `/admin/personas?q=${encodeURIComponent(q)}`
      : "/admin/personas";
    router.push(href);
  }

  return (
    <header className="admin-shell-v2-topbar sticky top-0 z-20 border-b border-[var(--color-border-default)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          className="inline-flex rounded-[10px] p-1.5 text-[var(--gray-500)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)] lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="hidden rounded-[10px] p-1.5 text-[var(--gray-500)] transition hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)] lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0 lg:hidden">
          <ProductMark href="/admin" size="sm" />
          <span className="sr-only">{PLATFORM_DISPLAY_NAME}</span>
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

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <AdminStatusBadges compatMode={compatMode} />
          <NotificationBell />
          <div className="mx-0.5 hidden h-6 w-px bg-[var(--color-border-default)] sm:block" aria-hidden />
          <div className="rounded-[12px] ring-1 ring-transparent transition hover:ring-[var(--color-border-default)]">
            <AdminUserMenuPanel user={user} compatMode={compatMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
