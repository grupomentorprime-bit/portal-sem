"use client";

import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { GlobalSearch } from "@/components/admin/kit/search/GlobalSearch";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminStatusBadges } from "@/components/admin/AdminStatusBadges";
import { AdminUserMenuPanel } from "@/components/admin/AdminUserMenuPanel";
import { NotificationBell } from "@/components/admin/notifications/NotificationBell";

export interface AdminTopBarProps extends AdminShellContext {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

function TenantLogo({ logoUrl, label }: { logoUrl?: string; label: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "C";

  if (logoUrl?.trim()) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-6 w-6 shrink-0 rounded-md object-contain"
      />
    );
  }

  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-text-inverse"
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function AdminTopBar({
  branding,
  user,
  compatMode,
  collapsed,
  onToggleSidebar,
  onOpenMobileNav,
}: AdminTopBarProps) {
  return (
    <header className="admin-shell-v2-topbar sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="flex h-14 items-center gap-1.5 px-2 sm:gap-2 sm:px-3">
        <button
          type="button"
          className="inline-flex rounded-lg p-1.5 text-muted transition hover:bg-background-muted hover:text-foreground lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="hidden rounded-lg p-1.5 text-muted transition hover:bg-background-muted hover:text-foreground lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <TenantLogo logoUrl={branding.logoUrl} label={branding.centerLabel} />
          <div className="hidden min-w-0 md:block">
            <span className="block truncate text-sm font-bold tracking-tight text-foreground">
              {branding.centerLabel}
            </span>
            <span className="block truncate text-[10px] text-muted">{branding.institutionName}</span>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <AdminStatusBadges compatMode={compatMode} />

          <GlobalSearch compact className="!hidden lg:!inline-flex" />

          <NotificationBell />

          <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden />

          <div className="rounded-lg ring-1 ring-transparent transition hover:ring-border">
            <AdminUserMenuPanel user={user} compatMode={compatMode} />
          </div>
        </div>
      </div>
    </header>
  );
}
