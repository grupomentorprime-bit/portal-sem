import type { AdminNavItem } from "@/lib/admin/institutional";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";
import {
  CONGRESS_VARONES_FORMS_ALIAS_PATH,
  CONGRESS_VARONES_HOME_PATH,
  CONGRESS_VARONES_LEGACY_PATH,
  isCongressAllowedAdminPath,
  isCongressAllowedNavItem,
  isCongressOnlyUser,
  isCongressOperator,
  usesCongressFocusedShell,
} from "@/core/congress/shell";
import { ensureSpecializedCapabilities } from "@/lib/desktop/register-specialized";
import {
  isStudentAffairsAdminOnlyNavItem,
  isStudentAffairsAllowedAdminPath,
  isStudentAffairsAllowedNavItem,
  isStudentAffairsOnlyUser,
  isStudentAffairsOperator,
  STUDENT_AFFAIRS_HOME_PATH,
  usesStudentAffairsFocusedShell,
} from "@/lib/student-affairs/shell";
import {
  ADMIN_SIDEBAR_SUPPLEMENTAL,
  adminPathMatchesNavGroups,
  buildAdminNavGroups,
  getAllNavTreeItems,
  type AdminNavGroup,
} from "@/lib/admin/nav-domains";
import { specializedNavPlacements } from "@/nelzuri";

export {
  CONGRESS_VARONES_FORMS_ALIAS_PATH,
  CONGRESS_VARONES_HOME_PATH,
  CONGRESS_VARONES_LEGACY_PATH,
  isCongressAllowedAdminPath,
  isCongressOnlyUser,
  isCongressOperator,
  usesCongressFocusedShell,
};
export {
  isStudentAffairsAllowedAdminPath,
  isStudentAffairsOnlyUser,
  isStudentAffairsOperator,
  STUDENT_AFFAIRS_HOME_PATH,
  usesStudentAffairsFocusedShell,
};

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

/** Lo que el shell puede mostrar además de la llave de Growth OS. */
export interface AdminShellScope {
  /** Techo ∩ llave de Growth OS. */
  growthOs: boolean;
  /** Capacidades especializadas que esta persona ya puede abrir. */
  opened: readonly string[];
}

/** Ítem de una capacidad institucional. El resto del árbol es Growth OS. */
export function navItemSpecializedId(item: AdminNavItem): string | null {
  ensureSpecializedCapabilities();
  const href = item.href ?? "";
  for (const placement of specializedNavPlacements()) {
    if (item.id && item.id === placement.navItem.id) return placement.appId;
    const home = placement.navItem.href;
    if (href && (href === home || href.startsWith(`${home}/`))) return placement.appId;
    for (const alias of placement.aliases) {
      if (href === alias || href.startsWith(`${alias}/`)) return placement.appId;
    }
  }
  return null;
}

function itemVisibleInShell(item: AdminNavItem, scope?: AdminShellScope | null): boolean {
  if (!scope) return true;
  const owner = navItemSpecializedId(item);
  if (owner) return scope.opened.includes(owner);
  return scope.growthOs;
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
    return isCongressAllowedNavItem(item);
  }

  if (isStudentAffairsOperator(roleCodes) && isStudentAffairsAdminOnlyNavItem(item)) {
    return false;
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return isStudentAffairsAllowedNavItem(item);
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
    return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) => isCongressAllowedNavItem(item));
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) => isStudentAffairsAllowedNavItem(item));
  }

  return ADMIN_SIDEBAR_SUPPLEMENTAL.filter((item) =>
    itemMatchesPermissions(item, permissions)
  );
}

export function filterAdminNav(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = [],
  scope?: AdminShellScope | null
): AdminNavItem[] {
  const visible = (item: AdminNavItem) => itemVisibleInShell(item, scope);

  if (usesCongressFocusedShell(permissions, roleCodes)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        visible(item) &&
        (item.href === "/admin" ||
          (item.href != null && item.href.startsWith(CONGRESS_VARONES_HOME_PATH)))
    );
  }

  if (usesStudentAffairsFocusedShell(permissions, compatMode, roleCodes)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        visible(item) &&
        (item.href === "/admin" ||
          (item.href != null && item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH)))
    );
  }

  return ADMIN_PRIMARY_NAV.filter((item) => {
    if (!visible(item)) return false;
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
  scope?: AdminShellScope | null,
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
    if (!itemVisibleInShell(item, scope)) return false;
    return true;
  });

  return restrictGroupsToEnabledApps(buildAdminNavGroups(visibleItems, navBadges), enabledAppIds);
}
