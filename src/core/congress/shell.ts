import type { AdminNavItem } from "@/lib/admin/institutional";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { CONGRESS_VARONES_FORM_ID } from "@/lib/experience/forms/already-enrolled";
import { registerRouteRules } from "@/nelzuri";

export const CONGRESS_VARONES_HOME_PATH = "/admin/portal/congreso-varones";
export const CONGRESS_VARONES_FORMS_ALIAS_PATH = `/admin/portal/forms/panel/${CONGRESS_VARONES_FORM_ID}`;
/** @deprecated Usar CONGRESS_VARONES_FORMS_ALIAS_PATH */
export const CONGRESS_VARONES_LEGACY_PATH = CONGRESS_VARONES_FORMS_ALIAS_PATH;

const ALLOWED_IDS = new Set(["dashboard-home", "congreso-varones", "support-help"]);

const ELEVATED_ADMIN_ROLE_CODES = new Set<RoleCode>([
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.INSTITUTION_ADMIN,
  ROLE_CODES.SUPPORT,
  ROLE_CODES.COMMUNICATIONS,
]);

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

export function isCongressAllowedNavItem(item: AdminNavItem): boolean {
  if (item.href == null) return false;
  if (item.id && ALLOWED_IDS.has(item.id)) return true;
  return (
    item.href === "/admin" ||
    item.href === CONGRESS_VARONES_HOME_PATH ||
    item.href.startsWith(`${CONGRESS_VARONES_HOME_PATH}/`) ||
    item.href === CONGRESS_VARONES_FORMS_ALIAS_PATH ||
    item.href.startsWith(`${CONGRESS_VARONES_FORMS_ALIAS_PATH}/`)
  );
}

export function usesCongressFocusedShell(permissions: string[], roleCodes: string[] = []): boolean {
  if (isCongressOperator(roleCodes)) return true;
  return isCongressOnlyUser(permissions);
}

export function registerCongressRouteRules(): void {
  registerRouteRules("congreso", {
    allowsPath: (pathname) => isCongressAllowedAdminPath(pathname),
    focusedShell: (permissions, roleCodes) => usesCongressFocusedShell([...permissions], [...roleCodes]),
    allowsNavItem: (item) => isCongressAllowedNavItem(item as AdminNavItem),
    focusOrder: 0,
  });
}
