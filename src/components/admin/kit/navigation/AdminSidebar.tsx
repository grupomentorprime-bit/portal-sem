"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDeferredEffect } from "@/hooks/use-deferred-effect";
import { ChevronDown, LogOut, Settings2, Sparkles, UserRound } from "lucide-react";
import { Drawer } from "@/components/admin/kit/drawers/Drawer";
import { NavIcon } from "@/components/admin/kit/navigation/NavIcon";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { AdminUserAvatar } from "@/components/admin/AdminUserAvatar";
import { ProductMark } from "@/components/product";
import { useNavGroupExpanded } from "@/components/admin/shell-v2/use-nav-group-expanded";
import type { AdminNavItem } from "@/lib/admin/institutional";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import {
  findActiveNavGroupId,
  isNavPlaceholder,
  isSidebarItemActive,
  NAV_SIDEBAR_ZONES,
  type AdminNavGroup,
  type NavGroupId,
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

function SidebarBrand({
  branding,
  collapsed,
}: {
  branding: AdminShellContext["branding"];
  collapsed: boolean;
}) {
  const spaceLabel =
    branding.institutionShortName?.trim() || branding.institutionName;
  const spaceInitial = spaceLabel.trim().charAt(0).toUpperCase() || "E";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-b border-[var(--sidebar-border)]",
        collapsed ? "items-center gap-2 px-2 py-3" : "gap-3 px-4 pb-4 pt-5"
      )}
    >
      {collapsed ? (
        <GrowthOsMark className="h-8 w-8 rounded-[10px]" />
      ) : (
        <Link
          href="/admin"
          className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
        >
          <GrowthOsMark />
          <ProductMark size="md" className="min-w-0 [&_span]:text-[var(--gray-900)]" />
        </Link>
      )}

      {!collapsed ? (
        <div className="flex min-w-0 items-center gap-2.5 rounded-[12px] border border-[var(--color-border-default)] border-l-2 border-l-[color-mix(in_srgb,var(--brand-primary)_55%,var(--color-border-default))] bg-[var(--gray-50)] px-2.5 py-2">
          {branding.logoUrl?.trim() ? (
            <img
              src={branding.logoUrl}
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
              {spaceLabel}
            </p>
          </div>
        </div>
      ) : branding.logoUrl?.trim() ? (
        <img
          src={branding.logoUrl}
          alt=""
          title={`Espacio activo · ${spaceLabel}`}
          className="h-6 w-6 rounded-md bg-white object-contain p-0.5"
        />
      ) : (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--gray-100)] text-[10px] font-bold text-[var(--growth-os-primary)]"
          title={`Espacio activo · ${spaceLabel}`}
          aria-label={`Espacio activo ${spaceLabel}`}
        >
          {spaceInitial}
        </span>
      )}
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
  if (isNavPlaceholder(item)) {
    const isSub = variant === "sub";
    return (
      <span
        title="Dirección visual — este módulo aún no existe"
        className={cn(
          "relative flex cursor-default items-center gap-2 rounded-[12px] text-[var(--gray-500)]",
          isSub
            ? "py-1.5 pl-3 pr-2 text-[12.5px] leading-snug"
            : "px-2.5 py-2 text-[13px] font-medium",
          collapsed && !isSub && "justify-center px-2"
        )}
      >
        {(showIcon || collapsed) && !isSub ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-[var(--gray-400)]">
            <NavIcon icon={item.icon} className="h-4 w-4 shrink-0" />
          </span>
        ) : null}
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </span>
    );
  }

  const active = isSidebarItemActive(pathname, item, searchParams);
  const isSub = variant === "sub";
  const href = item.href as string;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2 rounded-[12px] transition-colors duration-150",
        isSub
          ? "admin-nav-sub-link py-1.5 pl-3 pr-2 text-[12.5px] leading-snug"
          : "px-2.5 py-2 text-[13px] font-medium",
        isSub &&
          active &&
          "admin-nav-sub-link--active font-medium text-[var(--growth-os-primary)]",
        isSub &&
          !active &&
          "text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]",
        !isSub &&
          (active
            ? "bg-[var(--gray-100)] text-[var(--growth-os-primary)]"
            : "text-[var(--gray-800)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]"),
        collapsed && !isSub && "justify-center px-2"
      )}
    >
      {active && !isSub ? (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--growth-os-primary)]"
          aria-hidden
        />
      ) : null}
      {(showIcon || collapsed) && !isSub ? (
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[9px]",
            active
              ? "bg-white text-[var(--growth-os-primary)] shadow-[0_1px_2px_rgba(14,79,144,0.08)]"
              : "text-[var(--gray-500)]"
          )}
        >
          <NavIcon icon={item.icon} className="h-4 w-4 shrink-0" />
        </span>
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
  nested = false,
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
  nested?: boolean;
}) {
  const isSingleItem = group.items.length === 1;
  const hasActiveChild = group.items.some((item) =>
    isSidebarItemActive(pathname, item, searchParams)
  );
  const panelId = `nav-group-${group.id}`;

  if (isSingleItem) {
    const item = group.items[0];
    const linkItem = {
      ...item,
      label: group.label,
      icon: group.icon,
      badge: group.badge ?? item.badge,
    };
    return (
      <SidebarLink
        item={linkItem}
        pathname={pathname}
        searchParams={searchParams}
        collapsed={collapsed}
        onNavigate={onNavigate}
        variant={nested ? "sub" : "primary"}
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
            "flex w-full items-center justify-center rounded-[12px] px-2 py-2 transition-colors duration-150",
            hasActiveChild || flyoutOpen
              ? "bg-[var(--gray-100)] text-[var(--growth-os-primary)]"
              : "text-[var(--gray-800)] hover:bg-[var(--gray-50)]"
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
                key={item.id ?? item.href ?? item.label}
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
        "admin-nav-group rounded-[12px]",
        expanded && "admin-nav-group--expanded bg-[var(--sidebar-group-bg)]",
        !expanded && hasActiveChild && "bg-[var(--gray-50)]"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors duration-150",
          hasActiveChild || expanded
            ? "text-[var(--growth-os-primary)]"
            : "text-[var(--gray-800)] hover:bg-[var(--gray-50)] hover:text-[var(--gray-900)]"
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]",
            hasActiveChild || expanded
              ? "bg-white text-[var(--growth-os-primary)] shadow-[0_1px_2px_rgba(14,79,144,0.08)]"
              : "text-[var(--gray-500)]"
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
                key={item.id ?? item.href ?? item.label}
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
    <div className="admin-nav-zone-label px-2.5 pb-1.5 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gray-500)]">
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

  function renderGroup(group: AdminNavGroup, nested = false) {
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
        nested={nested}
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
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-3"
      aria-label={`${PLATFORM_DISPLAY_NAME} · Espacio`}
    >
      {NAV_SIDEBAR_ZONES.map((zone) => {
        const zoneGroups = zone.groupIds
          .map((id) => groupsById.get(id))
          .filter((group): group is AdminNavGroup => Boolean(group));

        if (zoneGroups.length === 0) return null;

        const isGrow = zone.id === "grow";
        const isTools = zone.id === "tools";

        return (
          <div
            key={zone.id}
            className={cn(
              isTools && "mt-auto border-t border-[var(--color-border-default)] pt-3"
            )}
          >
            {zone.label && !collapsed ? <SidebarZoneLabel label={zone.label} /> : null}
            <div className={cn("flex flex-col", isGrow ? "gap-0.5" : "gap-0.5")}>
              {zoneGroups.map((group) => renderGroup(group, isGrow))}
            </div>
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
    router.push("/admin/login");
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
      <SidebarBrand branding={ctx.branding} collapsed={collapsed} />
      <SidebarNav ctx={ctx} collapsed={collapsed} />
    </aside>
  );

  const mobile = (
    <Drawer
      open={mobileOpen}
      onClose={onMobileClose}
      title={PLATFORM_DISPLAY_NAME}
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
