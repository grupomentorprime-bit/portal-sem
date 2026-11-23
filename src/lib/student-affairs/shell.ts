import type { AdminNavItem } from "@/lib/admin/institutional";
import { isCongressOnlyUser, isCongressOperator } from "@/core/congress/shell";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { registerRouteRules } from "@/nelzuri";

export const STUDENT_AFFAIRS_HOME_PATH = "/admin/portal/asuntos-estudiantiles";

const OPERATOR_BLOCKED_PATH_PREFIXES = [
  "/admin/portal/forms",
  "/admin/portal/asuntos-estudiantiles/equipo",
] as const;

const ALLOWED_IDS = new Set(["dashboard-home", "convocatorias-resultados", "support-help"]);

const ELEVATED_ADMIN_ROLE_CODES = new Set<RoleCode>([
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.INSTITUTION_ADMIN,
  ROLE_CODES.SUPPORT,
  ROLE_CODES.COMMUNICATIONS,
]);

export function isStudentAffairsOnlyUser(permissions: string[], _compatMode: boolean): boolean {
  const hasStudentAffairs = permissions.some((permission) => permission.startsWith("student-affairs."));
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

export function isStudentAffairsOperator(roleCodes: string[]): boolean {
  return (
    roleCodes.includes(ROLE_CODES.STUDENT_AFFAIRS) &&
    !roleCodes.some((code) => ELEVATED_ADMIN_ROLE_CODES.has(code as RoleCode))
  );
}

export function isStudentAffairsAdminOnlyNavItem(item: AdminNavItem): boolean {
  if (item.id === "convocatorias-config") return true;
  const href = item.href ?? "";
  return OPERATOR_BLOCKED_PATH_PREFIXES.some((prefix) => href.startsWith(prefix));
}

export function isStudentAffairsAllowedAdminPath(pathname: string, roleCodes: string[] = []): boolean {
  if (!pathname || pathname === "/admin/login") return true;
  if (pathname === "/admin") return true;
  if (pathname.startsWith(STUDENT_AFFAIRS_HOME_PATH)) {
    if (
      isStudentAffairsOperator(roleCodes) &&
      OPERATOR_BLOCKED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
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

export function isStudentAffairsAllowedNavItem(item: AdminNavItem): boolean {
  if (item.href == null) return false;
  if (item.id && ALLOWED_IDS.has(item.id)) return true;
  return item.href === "/admin" || item.href.startsWith(STUDENT_AFFAIRS_HOME_PATH);
}

export function usesStudentAffairsFocusedShell(
  permissions: string[],
  compatMode: boolean,
  roleCodes: string[] = []
): boolean {
  if (isCongressOperator(roleCodes) || isCongressOnlyUser(permissions)) return false;
  if (isStudentAffairsOperator(roleCodes)) return true;
  return isStudentAffairsOnlyUser(permissions, compatMode);
}

function allowsNavItem(item: { id?: string; href?: string | null }, roleCodes: readonly string[]): boolean {
  const navItem = item as AdminNavItem;
  if (isStudentAffairsOperator([...roleCodes]) && isStudentAffairsAdminOnlyNavItem(navItem)) return false;
  return isStudentAffairsAllowedNavItem(navItem);
}

export function registerStudentAffairsRouteRules(): void {
  registerRouteRules("asuntos-estudiantiles", {
    allowsPath: (pathname, roleCodes) => isStudentAffairsAllowedAdminPath(pathname, [...roleCodes]),
    focusedShell: (permissions, roleCodes) =>
      usesStudentAffairsFocusedShell([...permissions], false, [...roleCodes]),
    allowsNavItem,
    focusOrder: 1,
  });
}
