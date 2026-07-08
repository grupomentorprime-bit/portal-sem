"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import { NavIcon } from "@/components/admin/kit/navigation/NavIcon";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { useNavGroupExpanded } from "@/components/admin/shell-v2/use-nav-group-expanded";
import type { AdminNavItem } from "@/lib/admin/institutional";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import {
  findActiveNavGroupId,
  isSidebarItemActive,
  NAV_SIDEBAR_ZONES,
  type AdminNavGroup,
  type NavGroupId,
} from "@/lib/admin/nav-domains";
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
          ? "bg-[color-mix(in_srgb,var(--color-warning)_88%,var(--color-primary))]"
          : "bg-[color-mix(in_srgb,var(--color-secondary)_88%,white)]"
      )}
      aria-label={`${count} pendientes`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SidebarBrand({
  branding,
  collapsed,
}: {
  branding: AdminShellContext["branding"];
  collapsed: boolean;
}) {
  const initial = branding.centerLabel.trim().charAt(0).toUpperCase() || "S";

  return (
    <div
      className={cn(
        "flex h-12 shrink-0 items-center gap-2.5 border-b border-[var(--sidebar-border)] px-3",
        collapsed && "justify-center px-2"
      )}
    >
      {branding.logoUrl?.trim() ? (
        <img
          src={branding.logoUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-md object-contain"
        />
      ) : (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--sidebar-active)] text-xs font-bold text-white"
          aria-hidden
        >
          {initial}
        </span>
      )}
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-white">
            {branding.centerLabel}
          </p>
          <p className="truncate text-[10px] text-[var(--sidebar-fg-muted)]">
            {branding.institutionShortName ?? branding.institutionName}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  searchParams,
  collapsed,
  onNavigate,
  variant = "primary",
  showIcon = true,
}: {
  item: AdminNavItem;
  pathname: string;
  searchParams: URLSearchParams;
  collapsed: boolean;
  onNavigate?: () => void;
  variant?: "primary" | "sub";
  showIcon?: boolean;
}) {
  const active = isSidebarItemActive(pathname, item, searchParams);
  const isSub = variant === "sub";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-md transition-colors duration-150",
        isSub
          ? "admin-nav-sub-link py-1.5 pl-3 pr-2 text-[12.5px] leading-snug"
          : "px-2.5 py-2 text-sm font-medium",
        isSub && active && "admin-nav-sub-link--active font-medium text-white",
        isSub &&
          !active &&
          "text-[color-mix(in_srgb,white_62%,transparent)] hover:bg-[var(--sidebar-hover)] hover:text-[color-mix(in_srgb,white_90%,transparent)]",
        !isSub &&
          (active
            ? "bg-[var(--sidebar-active)] text-white"
            : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"),
        collapsed && !isSub && "justify-center px-2"
      )}
    >
      {(showIcon || collapsed) && !isSub ? (
        <NavIcon icon={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-90" />
      ) : null}
      {!collapsed ? (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge ? <NavBadge count={item.badge} subtle={isSub} /> : null}
        </>
      ) : null}
    </Link>
  );
}

function NavGroupSection({
  group,
  pathname,
  searchParams,
  collapsed,
  expanded,
  onToggle,
  onNavigate,
  onFlyoutOpen,
  flyoutOpen,
}: {
  group: AdminNavGroup;
  pathname: string;
  searchParams: URLSearchParams;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onFlyoutOpen?: () => void;
  flyoutOpen?: boolean;
}) {
  const isSingleItem = group.items.length === 1;
  const hasActiveChild = group.items.some((item) =>
    isSidebarItemActive(pathname, item, searchParams)
  );
  const panelId = `nav-group-${group.id}`;

  if (isSingleItem) {
    const item = group.items[0];
    const linkItem =
      group.id === "support"
        ? item
        : { ...item, label: group.label, icon: group.icon, badge: group.badge ?? item.badge };
    return (
      <SidebarLink
        item={linkItem}
        pathname={pathname}
        searchParams={searchParams}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    );
  }

  if (collapsed) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onFlyoutOpen}
          title={group.label}
          aria-expanded={flyoutOpen}
          aria-controls={panelId}
          className={cn(
            "flex w-full items-center justify-center rounded-lg px-2 py-2 transition-colors duration-150",
            hasActiveChild || flyoutOpen
              ? "bg-[var(--sidebar-active)] text-white"
              : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"
          )}
        >
          <NavIcon icon={group.icon} className="h-[18px] w-[18px]" />
        </button>
        {flyoutOpen ? (
          <div
            id={panelId}
            className="admin-nav-flyout absolute left-full top-0 z-50 ml-2 min-w-[13rem] rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-lg)]"
          >
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
              {group.label}
            </p>
            {group.items.map((item) => (
              <SidebarLink
                key={item.id ?? item.href}
                item={item}
                pathname={pathname}
                searchParams={searchParams}
                collapsed={false}
                onNavigate={onNavigate}
                variant="sub"
                showIcon={false}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "admin-nav-group rounded-lg",
        expanded && "admin-nav-group--expanded bg-[var(--sidebar-group-bg)]",
        !expanded && hasActiveChild && "bg-[color-mix(in_srgb,black_8%,transparent)]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-150",
          hasActiveChild || expanded
            ? "text-white"
            : "text-[color-mix(in_srgb,white_70%,transparent)] hover:bg-[var(--sidebar-hover)] hover:text-white"
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            hasActiveChild || expanded
              ? "bg-[color-mix(in_srgb,white_16%,transparent)] text-white"
              : "bg-[color-mix(in_srgb,white_8%,transparent)] text-[color-mix(in_srgb,white_75%,transparent)]"
          )}
          aria-hidden
        >
          <NavIcon icon={group.icon} className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate text-[13px] font-semibold leading-tight tracking-tight">
          {group.label}
        </span>
        {group.badge ? <NavBadge count={group.badge} subtle /> : null}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "admin-nav-group__panel grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "admin-nav-group__panel--open" : "admin-nav-group__panel--closed"
        )}
      >
        <div className="overflow-hidden">
          <div className="admin-nav-subtree space-y-0.5 px-2.5 pb-2.5 pt-1.5">
            {group.items.map((item) => (
              <SidebarLink
                key={item.id ?? item.href}
                item={item}
                pathname={pathname}
                searchParams={searchParams}
                collapsed={false}
                onNavigate={onNavigate}
                variant="sub"
                showIcon={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarZoneLabel({ label }: { label: string }) {
  return (
    <div className="admin-nav-zone-label px-2.5 pb-1.5 pt-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,white_45%,transparent)]">
        {label}
      </span>
    </div>
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
  const activeGroupId = findActiveNavGroupId(pathname, groups, searchParams);
  const { isExpanded, toggleGroup, expandGroup } = useNavGroupExpanded(activeGroupId);
  const [flyoutGroupId, setFlyoutGroupId] = useState<NavGroupId | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeGroupId) expandGroup(activeGroupId);
  }, [activeGroupId, expandGroup]);

  useDeferredEffect(() => {
    if (!collapsed) setFlyoutGroupId(null);
  }, [collapsed]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setFlyoutGroupId(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const supportGroup = groupsById.get("support");

  function renderGroup(group: AdminNavGroup) {
    return (
      <NavGroupSection
        key={group.id}
        group={group}
        pathname={pathname}
        searchParams={searchParams}
        collapsed={collapsed}
        expanded={isExpanded(group.id)}
        onToggle={() => toggleGroup(group.id)}
        onNavigate={onNavigate}
        flyoutOpen={flyoutGroupId === group.id}
        onFlyoutOpen={() =>
          setFlyoutGroupId((current) => (current === group.id ? null : group.id))
        }
      />
    );
  }

  return (
    <nav
      ref={navRef}
      className="flex flex-1 flex-col overflow-y-auto px-2 py-2"
      aria-label="Administración"
    >
      {NAV_SIDEBAR_ZONES.map((zone) => {
        const zoneGroups = zone.groupIds
          .map((id) => groupsById.get(id))
          .filter((group): group is AdminNavGroup => Boolean(group));

        if (zoneGroups.length === 0) return null;

        const isHomeZone = zone.id === "home";

        return (
          <div key={zone.id} className={cn(!isHomeZone && "admin-nav-zone")}>
            {zone.label && !collapsed ? <SidebarZoneLabel label={zone.label} /> : null}
            <div className="flex flex-col gap-1">{zoneGroups.map(renderGroup)}</div>
          </div>
        );
      })}

      {supportGroup ? (
        <div className="admin-nav-zone admin-nav-zone--support mt-auto">
          {!collapsed ? <SidebarZoneLabel label="Soporte" /> : null}
          {renderGroup(supportGroup)}
        </div>
      ) : null}
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
  const institution = user.institutionName ?? ctx.branding.institutionName;

  async function handleLogout() {
    await fetch("/api/identity/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function navigate(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div ref={ref} className="relative border-t border-[var(--sidebar-border)] p-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={collapsed ? label : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-[var(--sidebar-hover)]",
          collapsed && "justify-center"
        )}
      >
        <AdminUserAvatar name={label} size="sm" />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{label}</p>
            <p className="truncate text-xs text-[var(--sidebar-fg-muted)]">{role}</p>
            <p className="truncate text-[11px] text-[var(--sidebar-fg-muted)]">{institution}</p>
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
            <p className="truncate text-[11px] text-muted">{institution}</p>
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
      <SidebarBrand branding={ctx.branding} collapsed={collapsed} />
      <SidebarNav ctx={ctx} collapsed={collapsed} />
      <SidebarProfileMenu ctx={ctx} collapsed={collapsed} />
    </aside>
  );

  const mobile = (
    <Drawer
      open={mobileOpen}
      onClose={onMobileClose}
      title={ctx.branding.centerLabel}
      side="left"
      className="max-w-none sm:max-w-sm"
    >
      <SidebarBrand branding={ctx.branding} collapsed={false} />
      <SidebarNav ctx={ctx} collapsed={false} onNavigate={onMobileClose} />
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
