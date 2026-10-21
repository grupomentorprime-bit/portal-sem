"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { AdminShellContext } from "@/components/admin/kit/utils/types";
import { filterAdminNavGroups } from "@/lib/admin/nav-access";
import {
  findActiveNavGroupId,
  isNavPlaceholder,
  isSidebarItemActive,
} from "@/lib/admin/nav-domains";
import { cn } from "@/lib/utils";

interface AdminModuleSubnavProps {
  permissions: AdminShellContext["permissions"];
  compatMode: AdminShellContext["compatMode"];
  roleCodes: AdminShellContext["roleCodes"];
  navBadges?: AdminShellContext["navBadges"];
}

/**
 * Subnavegación del módulo activo — visible cuando el grupo del sidebar
 * tiene más de un destino (p. ej. CRM · Conversión).
 */
export function AdminModuleSubnav({
  permissions,
  compatMode,
  roleCodes,
  navBadges,
}: AdminModuleSubnavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = filterAdminNavGroups(permissions, compatMode, roleCodes, navBadges);
  const activeGroupId = findActiveNavGroupId(pathname, groups, searchParams);
  const activeGroup = activeGroupId
    ? groups.find((group) => group.id === activeGroupId)
    : undefined;

  if (!activeGroup || activeGroup.items.length < 2) return null;

  const items = activeGroup.items.filter((item) => !isNavPlaceholder(item));
  if (items.length < 2) return null;

  return (
    <nav
      className="mb-5 -mt-1 flex gap-1 overflow-x-auto border-b border-[var(--color-border-default)] pb-px"
      aria-label={`${activeGroup.label} · secciones`}
    >
      {items.map((item) => {
        const active = isSidebarItemActive(pathname, item, searchParams);
        const href = item.href as string;
        return (
          <Link
            key={item.id ?? item.href ?? item.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-t-[10px] px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "border-b-2 border-[var(--growth-os-primary)] text-[var(--growth-os-primary)]"
                : "border-b-2 border-transparent text-[var(--gray-500)] hover:text-[var(--gray-900)]"
            )}
          >
            {item.label}
            {item.badge && item.badge > 0 ? (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--growth-os-primary)] px-1 text-[9px] font-bold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
