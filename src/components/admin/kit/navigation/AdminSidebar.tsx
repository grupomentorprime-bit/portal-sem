"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Crown, LogOut, Settings2, UserRound } from "lucide-react";
import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import { NavIcon } from "@/components/admin/kit/navigation/NavIcon";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { ProductMark } from "@/components/product";
import type { AdminNavItem } from "@/lib/admin/institutional";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import {
  isNavGroupActive,
  isNavPlaceholder,
  isSidebarItemActive,
  navGroupAsSidebarLink,
  NAV_SIDEBAR_ZONES,
  type AdminNavGroup,
} from "@/lib/admin/nav-domains";
import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { cn } from "@/lib/utils";

export interface AdminSidebarProps extends AdminShellContext {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** Maqueta visual — sin motor de onboarding ni billing. */
const SIDEBAR_GROWTH_PROGRESS = 70;

function NavBadge({ count, subtle = false }: { count: number; subtle?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white",
        subtle
          ? "bg-[color-mix(in_srgb,var(--color-warning)_88%,var(--growth-os-primary))]"
          : "bg-[var(--growth-os-primary)]"
      )}
      aria-label={`${count} pendientes`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function GrowthOsMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-end justify-center gap-[3px] overflow-hidden rounded-[12px] bg-[var(--growth-os-primary)] px-2 pb-2 pt-2.5",
        className
      )}
      aria-hidden
    >
      <span className="h-2 w-[3px] rounded-sm bg-white/90" />
      <span className="h-3.5 w-[3px] rounded-sm bg-white" />
      <span className="h-2.5 w-[3px] rounded-sm bg-white/90" />
    </span>
  );
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0",
        collapsed ? "items-center justify-center px-2 py-4" : "px-4 pb-2 pt-5"
      )}
    >
      {collapsed ? (
        <Link href="/admin" className="transition hover:opacity-90" aria-label={PLATFORM_DISPLAY_NAME}>
          <GrowthOsMark className="h-8 w-8 rounded-[10px]" />
        </Link>
      ) : (
        <Link
          href="/admin"
          className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
        >
          <GrowthOsMark />
          <ProductMark size="md" className="min-w-0 [&_span]:text-white" />
        </Link>
      )}
    </div>
  );
}

function SidebarFooter({
  branding,
  collapsed,
  onNavigate,
}: {
  branding: AdminShellContext["branding"];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const spaceLabel =
    branding.institutionShortName?.trim() || branding.institutionName;

  if (collapsed) {
    return (
      <div className="mt-auto flex shrink-0 flex-col items-center gap-2 border-t border-[var(--sidebar-border)] px-2 py-3">
        <Link
          href="/admin/settings/team"
          onClick={onNavigate}
          title={`${spaceLabel} · Plan Pro`}
          aria-label={`Espacio activo ${spaceLabel}`}
          className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,white_8%,transparent)] text-[var(--color-warning)] transition hover:bg-[var(--sidebar-hover)]"
        >
          <Crown className="h-4 w-4" strokeWidth={2} />
        </Link>
        <Link
          href="/admin"
          onClick={onNavigate}
          title="Acelera tu crecimiento"
          aria-label="Continuar configuración"
          className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--growth-os-primary)] text-[11px] font-bold text-white transition hover:opacity-90"
        >
          {SIDEBAR_GROWTH_PROGRESS}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-auto flex shrink-0 flex-col gap-2.5 border-t border-[var(--sidebar-border)] px-3 py-3">
      <Link
        href="/admin/settings/team"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-[14px] border border-[var(--sidebar-border)] bg-[color-mix(in_srgb,white_6%,transparent)] px-2.5 py-2.5 transition hover:bg-[var(--sidebar-hover)]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--color-warning)_22%,transparent)] text-[var(--color-warning)]"
          aria-hidden
        >
          <Crown className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-tight text-white">
            {spaceLabel}
          </span>
          <span className="block truncate text-[11px] text-[var(--sidebar-fg-muted)]">
            Plan Pro
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--sidebar-fg-muted)]" aria-hidden />
      </Link>

      <div className="rounded-[14px] border border-[var(--sidebar-border)] bg-[color-mix(in_srgb,white_6%,transparent)] px-3 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[18px] font-semibold tracking-tight text-white">
            {SIDEBAR_GROWTH_PROGRESS}%
          </p>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,white_12%,transparent)]"
          role="progressbar"
          aria-valuenow={SIDEBAR_GROWTH_PROGRESS}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de configuración"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--growth-os-primary)] to-[var(--growth-os-accent)]"
            style={{ width: `${SIDEBAR_GROWTH_PROGRESS}%` }}
          />
        </div>
        <p className="mt-3 text-[12px] font-semibold leading-snug text-white">
          Acelera tu crecimiento
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--sidebar-fg-muted)]">
          Completa la configuración para potenciar tus resultados
        </p>
        <Link
          href="/admin"
          onClick={onNavigate}
          className="mt-3 flex h-9 items-center justify-center rounded-[10px] bg-[var(--growth-os-primary)] text-[12px] font-semibold text-white transition hover:opacity-90"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  searchParams,
  collapsed,
  onNavigate,
  activeOverride,
}: {
  item: AdminNavItem;
  pathname: string;
  searchParams: URLSearchParams;
  collapsed: boolean;
  onNavigate?: () => void;
  /** Activo a nivel de grupo (cualquier hija del módulo). */
  activeOverride?: boolean;
}) {
  if (isNavPlaceholder(item)) {
    return (
      <span
        title="Dirección visual — este módulo aún no existe"
        className={cn(
          "relative flex cursor-default items-center gap-2 rounded-[12px] px-2.5 py-2 text-[13px] font-medium text-[var(--gray-500)]",
          collapsed && "justify-center px-2"
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--gray-400)]">
          <NavIcon icon={item.icon} className="h-4 w-4 shrink-0" />
        </span>
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </span>
    );
  }

  const active =
    activeOverride ?? isSidebarItemActive(pathname, item, searchParams);
  const href = item.href as string;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-[12px] px-2.5 py-2 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
          : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)] hover:text-white",
        collapsed && "justify-center px-2"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-[9px]",
          active ? "text-[var(--sidebar-active-fg)]" : "text-[var(--sidebar-fg-muted)]"
        )}
      >
        <NavIcon icon={item.icon} className="h-4 w-4 shrink-0" />
      </span>
      {!collapsed ? (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge ? <NavBadge count={item.badge} /> : null}
        </>
      ) : null}
    </Link>
  );
}

function SidebarNav({
  ctx,
  collapsed,
  onNavigate,
}: {
  ctx: AdminShellContext;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = filterAdminNavGroups(
    ctx.permissions,
    ctx.compatMode,
    ctx.roleCodes,
    ctx.navBadges
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3"
      aria-label={`${PLATFORM_DISPLAY_NAME} · Espacio`}
    >
      {NAV_SIDEBAR_ZONES.map((zone) => {
        const zoneGroups = zone.groupIds
          .map((id) => groupsById.get(id))
          .filter((group): group is AdminNavGroup => Boolean(group));

        if (zoneGroups.length === 0) return null;

        return (
          <div key={zone.id} className="flex flex-col gap-0.5">
            {zoneGroups.map((group) => {
              const link = navGroupAsSidebarLink(group);
              if (!link) return null;
              return (
                <SidebarLink
                  key={group.id}
                  item={link}
                  pathname={pathname}
                  searchParams={searchParams}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  activeOverride={isNavGroupActive(pathname, group, searchParams)}
                />
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarProfileMenu({
  ctx,
  collapsed,
  onNavigate,
}: {
  ctx: AdminShellContext;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const user = ctx.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const label = user.displayName || user.email;
  const role = user.roleLabel ?? "Colaborador";

  async function handleLogout() {
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function navigate(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div ref={ref} className="relative border-t border-[var(--sidebar-border)] p-2 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? label : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[12px] p-2 text-left transition-colors duration-200 hover:bg-[var(--gray-50)]",
          collapsed && "justify-center"
        )}
      >
        <AdminUserAvatar name={label} size="sm" />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--gray-900)]">{label}</p>
            <p className="truncate text-xs text-[var(--gray-500)]">{role}</p>
          </div>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)]",
            collapsed
              ? "bottom-full left-full mb-0 ml-2 w-56"
              : "bottom-full left-2 right-2 mb-2 w-auto"
          )}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            <p className="truncate text-xs text-muted">{role}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => navigate("/admin/settings/profile")}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-background-muted"
          >
            <UserRound className="h-4 w-4 text-muted" />
            Mi perfil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => navigate("/admin/settings/notifications")}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-background-muted"
          >
            <Settings2 className="h-4 w-4 text-muted" />
            Preferencias
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-[var(--color-danger)] hover:bg-background-muted"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  ...ctx
}: AdminSidebarProps) {
  const desktop = (
    <aside
      className={cn(
        "admin-shell-v2-sidebar hidden lg:flex lg:flex-col",
        collapsed ? "admin-shell-v2-sidebar--collapsed" : "admin-shell-v2-sidebar--expanded"
      )}
      aria-label="Barra lateral"
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav ctx={ctx} collapsed={collapsed} />
      <SidebarFooter
        branding={ctx.branding}
        collapsed={collapsed}
        onNavigate={undefined}
      />
    </aside>
  );

  const mobile = (
    <Drawer
      open={mobileOpen}
      onClose={onMobileClose}
      title={PLATFORM_DISPLAY_NAME}
      side="left"
      className="admin-shell-v2-drawer max-w-none sm:max-w-sm"
    >
      <SidebarBrand collapsed={false} />
      <SidebarNav ctx={ctx} collapsed={false} onNavigate={onMobileClose} />
      <SidebarFooter
        branding={ctx.branding}
        collapsed={false}
        onNavigate={onMobileClose}
      />
      <SidebarProfileMenu ctx={ctx} collapsed={false} onNavigate={onMobileClose} />
    </Drawer>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
