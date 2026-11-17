"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Crown, LogOut, Settings2, Sparkles, UserRound } from "lucide-react";
import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import { NavIcon } from "@/components/admin/kit/navigation/NavIcon";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
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
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[var(--growth-os-primary)]",
        className
      )}
      aria-hidden
    >
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-br-[12px] bg-[var(--growth-os-accent)]" />
      <Sparkles className="relative h-4 w-4 text-white" strokeWidth={2.25} />
    </span>
  );
}

function SidebarBrand({
  collapsed,
  spaceName,
}: {
  collapsed: boolean;
  spaceName: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0",
        collapsed ? "items-center justify-center px-2 py-4" : "px-3.5 pb-4 pt-4"
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
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-tight tracking-[-0.03em] text-white">
              {PLATFORM_DISPLAY_NAME}
            </span>
            {spaceName ? (
              <span className="mt-0.5 block truncate text-[11px] leading-snug text-[var(--growth-os-on-ink-muted)]">
                {spaceName}
              </span>
            ) : null}
          </span>
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
      </div>
    );
  }

  return (
    <div className="mt-auto px-2.5 pb-3 pt-2">
      <div className="overflow-hidden rounded-2xl bg-[var(--growth-os-primary)] px-3.5 py-3.5">
        <p className="truncate text-[13px] font-semibold text-white">{spaceLabel}</p>
        <p className="mt-1 text-[12px] leading-snug text-white/75">Plan Pro</p>
        <Link
          href="/admin/settings/team"
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/35 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-white/10"
        >
          Equipo
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
    ctx.navBadges,
    ctx.enabledAppIds
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
  const spaceName =
    ctx.branding.institutionShortName?.trim() || ctx.branding.institutionName || "";
  const desktop = (
    <aside
      className={cn(
        "admin-shell-v2-sidebar hidden lg:flex lg:flex-col",
        collapsed ? "admin-shell-v2-sidebar--collapsed" : "admin-shell-v2-sidebar--expanded"
      )}
      aria-label="Barra lateral"
    >
      <SidebarBrand collapsed={collapsed} spaceName={spaceName} />
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
      <SidebarBrand collapsed={false} spaceName={spaceName} />
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
