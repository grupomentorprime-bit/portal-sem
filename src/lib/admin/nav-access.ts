import type { AdminNavItem } from "@/lib/admin/institutional";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import {
  ADMIN_SIDEBAR_SUPPLEMENTAL,
  adminPathMatchesNavGroups,
  buildAdminNavGroups,
  getAllNavTreeItems,
  type AdminNavGroup,
} from "@/lib/admin/nav-domains";

export const STUDENT_AFFAIRS_HOME_PATH = "/admin/portal/asuntos-estudiantiles";
/** Home operativa del Congreso de Varones. */
export const CONGRESS_VARONES_HOME_PATH = "/admin/portal/congreso-varones";
/** Alias desde Formularios → Operación (mismo panel). */
export const CONGRESS_VARONES_FORMS_ALIAS_PATH = `/admin/portal/forms/panel/${CONGRESS_VARONES_FORM_ID}`;
/** @deprecated Usar CONGRESS_VARONES_FORMS_ALIAS_PATH */
export const CONGRESS_VARONES_LEGACY_PATH = CONGRESS_VARONES_FORMS_ALIAS_PATH;

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
  /** Placeholders del patrón maestro: visibles en shell completo (sin IAM propia). */
  if (item.href == null) return true;

  if (item.requiredPermissions?.length) {
    return item.requiredPermissions.every((p) => permissions.includes(p));
  }
  if (item.requiredAnyPermission?.length) {
    return item.requiredAnyPermission.some((p) => permissions.includes(p));
  }
  return false;
}

export function isStudentAffairsOnlyUser(permissions: string[], _compatMode: boolean): boolean {
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

/** Operador del Congreso de Varones — sin AE, Growth ni admin global. */
export function isCongressOperator(roleCodes: string[]): boolean {
  return (
    roleCodes.includes(ROLE_CODES.CONGRESS_OPERATOR) &&
    !roleCodes.some((code) => ELEVATED_ADMIN_ROLE_CODES.has(code as RoleCode)) &&
    !roleCodes.includes(ROLE_CODES.STUDENT_AFFAIRS)
  );
}

export function isCongressOnlyUser(permissions: string[]): boolean {
  const hasCongress = permissions.some((permission) => permission.startsWith("congress."));
  const hasBroaderAccess = permissions.some(
    (permission) =>
      permission.startsWith("cms.") ||
      permission === "experience.forms.manage" ||
      permission === "settings.team" ||
      permission.startsWith("student-affairs.") ||
      permission.startsWith("growth.")
  );
  return hasCongress && !hasBroaderAccess;
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

/** Rutas admin permitidas para operadores del congreso. */
export function isCongressAllowedAdminPath(pathname: string): boolean {
  if (!pathname || pathname === "/admin/login") return true;
  if (pathname === "/admin") return true;
  if (pathname === CONGRESS_VARONES_HOME_PATH || pathname.startsWith(`${CONGRESS_VARONES_HOME_PATH}/`)) {
    return true;
  }
  if (
    pathname === CONGRESS_VARONES_FORMS_ALIAS_PATH ||
    pathname.startsWith(`${CONGRESS_VARONES_FORMS_ALIAS_PATH}/`)
  ) {
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
  if (isCongressOperator(roleCodes) || isCongressOnlyUser(permissions)) return false;
  if (isStudentAffairsOperator(roleCodes)) return true;
  return isStudentAffairsOnlyUser(permissions, compatMode);
}

export function usesCongressFocusedShell(
  permissions: string[],
  roleCodes: string[] = []
): boolean {
  if (isCongressOperator(roleCodes)) return true;
  return isCongressOnlyUser(permissions);
}

const STUDENT_AFFAIRS_ALLOWED_IDS = new Set([
  "dashboard-home",
  "convocatorias-resultados",
  "support-help",
]);

const CONGRESS_ALLOWED_IDS = new Set(["dashboard-home", "congreso-varones", "support-help"]);

function isStudentAffairsAllowedItem(item: AdminNavItem): boolean {
  if (item.href == null) return false;
  if (item.id && STUDENT_AFFAIRS_ALLOWED_IDS.has(item.id)) return true;
  return item.href === "/admin" || item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH);
}

function isCongressAllowedItem(item: AdminNavItem): boolean {
  if (item.href == null) return false;
  if (item.id && CONGRESS_ALLOWED_IDS.has(item.id)) return true;
  return (
    item.href === "/admin" ||
    item.href === CONGRESS_VARONES_HOME_PATH ||
    item.href.startsWith(`${CONGRESS_VARONES_HOME_PATH}/`) ||
    item.href === CONGRESS_VARONES_FORMS_ALIAS_PATH ||
    item.href.startsWith(`${CONGRESS_VARONES_FORMS_ALIAS_PATH}/`)
  );
}

function isCongressNavItem(item: AdminNavItem): boolean {
  if (item.id === "congreso-varones") return true;
  const href = item.href ?? "";
  return (
    href === CONGRESS_VARONES_HOME_PATH ||
    href.startsWith(`${CONGRESS_VARONES_HOME_PATH}/`)
  );
}

export function filterNavItem(
  item: AdminNavItem,
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = [],
  showCongressVarones = true
): boolean {
  if (isCongressNavItem(item) && !showCongressVarones) return false;

  if (usesCongressFocusedShell(permissions, roleCodes)) {
    return isCongressAllowedItem(item);
  }

  if (isStudentAffairsOperator(roleCodes) && isStudentAffairsAdminOnlyNavItem(item)) {
    return false;
  }

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
  if (usesCongressFocusedShell(permissions, roleCodes)) {
    return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) => isCongressAllowedItem(item));
  }

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
  if (usesCongressFocusedShell(permissions, roleCodes)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        item.href === "/admin" ||
        (item.href != null && item.href.startsWith(CONGRESS_VARONES_HOME_PATH))
    );
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        item.href === "/admin" ||
        (item.href != null && item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH))
    );
  }

  return ADMIN_PRIMARY_NAV.filter((item) => {
    if (item.href == null) return false;
    if (item.requiredRole?.length) {
      const hasRole = item.requiredRole.some((r) => roleCodes.includes(r));
      if (!hasRole) return false;
    }
    return itemMatchesPermissions(item, permissions);
  });
}

const UNIT_SHELL_PATHS = [
  "/admin/settings/profile",
  "/admin/settings/help",
  "/admin/settings/notifications",
] as const;

/**
 * null = administración del Espacio, sin recorte de aplicaciones.
 * Un arreglo limita el admin a Inicio y a las aplicaciones habilitadas en sus unidades.
 */
export function isUnitScopedAdminPathAllowed(
  pathname: string,
  enabledAppIds: readonly string[] | null
): boolean {
  if (enabledAppIds == null) return true;
  if (!pathname || pathname === "/admin/login") return true;
  if (pathname === "/admin" || pathname === "/admin/") return true;
  if (
    UNIT_SHELL_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  return adminPathMatchesNavGroups(pathname, enabledAppIds);
}

function restrictGroupsToEnabledApps(
  groups: AdminNavGroup[],
  enabledAppIds: readonly string[] | null | undefined
): AdminNavGroup[] {
  if (enabledAppIds == null) return groups;
  const allowed = new Set<string>(["dashboard", ...enabledAppIds]);
  return groups
    .filter((group) => allowed.has(group.id))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.href !== "/admin/settings/units"),
    }));
}

/** Árbol de navegación V2 filtrado por IAM. */
export function filterAdminNavGroups(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = [],
  navBadges?: Record<string, number>,
  enabledAppIds?: readonly string[] | null,
  showCongressVarones = true
): AdminNavGroup[] {
  const focusedShell =
    usesCongressFocusedShell(permissions, roleCodes) ||
    usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes);

  const visibleItems = getAllNavTreeItems().filter((item) => {
    if (!filterNavItem(item, permissions, compatMode, roleCodes, showCongressVarones)) {
      return false;
    }
    if (focusedShell && item.id === "dashboard-home") return false;
    return true;
  });

  return restrictGroupsToEnabledApps(buildAdminNavGroups(visibleItems, navBadges), enabledAppIds);
}
