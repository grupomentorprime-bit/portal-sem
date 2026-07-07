import type { AdminNavItem } from "@/lib/admin/institutional";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import {
  ADMIN_SIDEBAR_SUPPLEMENTAL,
  buildAdminNavGroups,
  getAllNavTreeItems,
  type AdminNavGroup,
} from "@/lib/admin/nav-domains";

export const STUDENT_AFFAIRS_HOME_PATH = "/admin/portal/asuntos-estudiantiles";

const STUDENT_AFFAIRS_OPERATOR_BLOCKED_PATH_PREFIXES = [
  "/admin/portal/forms",
  "/admin/portal/asuntos-estudiantiles/equipo",
] as const;

function isStudentAffairsAdminOnlyNavItem(item: AdminNavItem): boolean {
  if (item.id === "convocatorias-config") return true;
  const href = item.href ?? "";
  return STUDENT_AFFAIRS_OPERATOR_BLOCKED_PATH_PREFIXES.some((prefix) => href.startsWith(prefix));
}

const ELEVATED_ADMIN_ROLE_CODES = new Set<RoleCode>([
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.INSTITUTION_ADMIN,
  ROLE_CODES.SUPPORT,
  ROLE_CODES.COMMUNICATIONS,
]);

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

/** Operador con rol Asuntos Estudiantiles (cualquier usuario del tenant, no por persona). */
export function isStudentAffairsOperator(roleCodes: string[]): boolean {
  return (
    roleCodes.includes(ROLE_CODES.STUDENT_AFFAIRS) &&
    !roleCodes.some((code) => ELEVATED_ADMIN_ROLE_CODES.has(code as RoleCode))
  );
}

/** Rutas admin permitidas para operadores de Asuntos Estudiantiles. */
export function isStudentAffairsAllowedAdminPath(
  pathname: string,
  roleCodes: string[] = []
): boolean {
  if (!pathname || pathname === "/admin/login") return true;
  if (pathname === "/admin") return true;
  if (pathname.startsWith(STUDENT_AFFAIRS_HOME_PATH)) {
    if (
      isStudentAffairsOperator(roleCodes) &&
      STUDENT_AFFAIRS_OPERATOR_BLOCKED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      return false;
    }
    return true;
  }
  if (pathname.startsWith("/admin/settings/help")) return true;
  if (pathname.startsWith("/admin/settings/profile")) return true;
  if (pathname.startsWith("/admin/settings/notifications")) return true;
  return false;
}

/** Shell restringido: inicio y navegación centrados en operación de convocatorias. */
export function usesStudentAffairsFocusedShell(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): boolean {
  if (compatMode) return false;
  if (isStudentAffairsOperator(roleCodes)) return true;
  return isStudentAffairsOnlyUser(permissions, compatMode);
}

const STUDENT_AFFAIRS_ALLOWED_IDS = new Set([
  "dashboard-home",
  "convocatorias-resultados",
  "support-help",
]);

function isStudentAffairsAllowedItem(item: AdminNavItem): boolean {
  if (item.id && STUDENT_AFFAIRS_ALLOWED_IDS.has(item.id)) return true;
  return item.href === "/admin" || item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH);
}

export function filterNavItem(
  item: AdminNavItem,
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): boolean {
  if (isStudentAffairsOperator(roleCodes) && isStudentAffairsAdminOnlyNavItem(item)) {
    return false;
  }

  if (compatMode) return true;

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
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
  compatMode: boolean,
  roleCodes: string[] = []
): AdminNavItem[] {
  if (compatMode) return ADMIN_SIDEBAR_SUPPLEMENTAL;

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) => isStudentAffairsAllowedItem(item));
  }

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

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        item.href === "/admin" || item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH)
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
  const focusedShell = usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes);

  const visibleItems = getAllNavTreeItems().filter((item) => {
    if (!filterNavItem(item, permissions, compatMode, roleCodes)) return false;
    if (focusedShell && item.id === "dashboard-home") return false;
    return true;
  });

  return buildAdminNavGroups(visibleItems, navBadges);
}
