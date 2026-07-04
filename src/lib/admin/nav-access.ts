import type { AdminNavItem } from "@/lib/admin/institutional";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";
import {
  ADMIN_SIDEBAR_SUPPLEMENTAL,
  buildAdminNavGroups,
  getAllNavTreeItems,
  type AdminNavGroup,
} from "@/lib/admin/nav-domains";

function itemMatchesPermissions(item: AdminNavItem, permissions: string[]): boolean {
  if (item.requiredPermissions?.length) {
    return item.requiredPermissions.every((p) => permissions.includes(p));
  }
  if (item.requiredAnyPermission?.length) {
    return item.requiredAnyPermission.some((p) => permissions.includes(p));
  }
  return false;
}

export function isStudentAffairsOnlyUser(permissions: string[], compatMode: boolean): boolean {
  if (compatMode) return false;

  const hasStudentAffairs = permissions.some((permission) =>
    permission.startsWith("student-affairs.")
  );
  const hasBroaderAccess = permissions.some(
    (permission) =>
      permission.startsWith("cms.") ||
      permission === "experience.forms.manage" ||
      permission === "settings.team" ||
      permission.startsWith("programs.") ||
      permission.startsWith("news.") ||
      permission.startsWith("content.")
  );

  return hasStudentAffairs && !hasBroaderAccess;
}

const STUDENT_AFFAIRS_ALLOWED_IDS = new Set([
  "dashboard-home",
  "convocatorias-resultados",
  "support-help",
]);

function isStudentAffairsAllowedItem(item: AdminNavItem): boolean {
  if (item.id && STUDENT_AFFAIRS_ALLOWED_IDS.has(item.id)) return true;
  return (
    item.href === "/admin" || item.href.startsWith("/admin/portal/asuntos-estudiantiles")
  );
}

export function filterNavItem(
  item: AdminNavItem,
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): boolean {
  if (compatMode) return true;

  if (isStudentAffairsOnlyUser(permissions, compatMode)) {
    return isStudentAffairsAllowedItem(item);
  }

  if (item.requiredRole?.length) {
    const hasRole = item.requiredRole.some((r) => roleCodes.includes(r));
    if (!hasRole) return false;
  }

  return itemMatchesPermissions(item, permissions);
}

export function filterSupplementalNav(
  permissions: string[],
  compatMode: boolean
): AdminNavItem[] {
  if (compatMode) return ADMIN_SIDEBAR_SUPPLEMENTAL;

  return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) =>
    itemMatchesPermissions(item, permissions)
  );
}

export function filterAdminNav(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): AdminNavItem[] {
  if (compatMode) return ADMIN_PRIMARY_NAV;

  if (isStudentAffairsOnlyUser(permissions, compatMode)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        item.href === "/admin" || item.href.startsWith("/admin/portal/asuntos-estudiantiles")
    );
  }

  return ADMIN_PRIMARY_NAV.filter((item) => {
    if (item.requiredRole?.length) {
      const hasRole = item.requiredRole.some((r) => roleCodes.includes(r));
      if (!hasRole) return false;
    }
    return itemMatchesPermissions(item, permissions);
  });
}

/** Árbol de navegación V2 filtrado por IAM. */
export function filterAdminNavGroups(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = [],
  navBadges?: Record<string, number>
): AdminNavGroup[] {
  const visibleItems = getAllNavTreeItems().filter((item) =>
    filterNavItem(item, permissions, compatMode, roleCodes)
  );

  return buildAdminNavGroups(visibleItems, navBadges);
}
