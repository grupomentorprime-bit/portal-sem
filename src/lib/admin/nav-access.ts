import type { AdminNavItem } from "@/lib/admin/institutional";
import { ADMIN_PRIMARY_NAV } from "@/lib/admin/institutional";

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

export function filterAdminNav(
  permissions: string[],
  compatMode: boolean
): AdminNavItem[] {
  if (compatMode) return ADMIN_PRIMARY_NAV;

  if (isStudentAffairsOnlyUser(permissions, compatMode)) {
    return ADMIN_PRIMARY_NAV.filter(
      (item) =>
        item.href === "/admin" || item.href.startsWith("/admin/portal/asuntos-estudiantiles")
    );
  }

  return ADMIN_PRIMARY_NAV.filter((item) => {
    if (!item.requiredAnyPermission?.length) return true;
    return item.requiredAnyPermission.some((permission) => permissions.includes(permission));
  });
}
