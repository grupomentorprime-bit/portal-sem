import {
  CONGRESS_VARONES_FORMS_ALIAS_PATH,
  CONGRESS_VARONES_HOME_PATH,
  isCongressAllowedAdminPath,
  isStudentAffairsAllowedAdminPath,
  STUDENT_AFFAIRS_HOME_PATH,
  usesCongressFocusedShell,
  usesStudentAffairsFocusedShell,
} from "@/lib/admin/nav-access";
import { specializedForDesk } from "@/lib/desktop/specialized";
import {
  manifestById,
  specializedAppForInternalPath,
  type SpecializedAppId,
} from "@/nelzuri";

const SESSION_PATHS = new Set(["/admin/login", "/admin/sin-espacio"]);

function pathWithin(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Ruta de una capacidad, incluido el alias que el Congreso ya usa. */
export function specializedAppForAdminPath(pathname: string): SpecializedAppId | null {
  if (pathWithin(pathname, CONGRESS_VARONES_FORMS_ALIAS_PATH)) return "congreso";
  return specializedAppForInternalPath(pathname);
}

export interface AdminEntryInput {
  pathname: string;
  /** Techo ∩ llave de Growth OS. No abre una capacidad institucional. */
  growthOs: boolean;
  tenantId: string;
  permissions: readonly string[];
  roleCodes?: readonly string[];
  unitIds: readonly string[] | null;
  enabledUnitAppIds: readonly string[] | null;
}

/**
 * Separa el shell.
 * La capacidad se abre con su puerta. CRM, ventas y el inicio de Growth OS exigen la llave.
 * Las rutas no cambian: lo que no corresponde vuelve a la capacidad abierta o al escritorio.
 */
export function decideAdminEntry(
  input: AdminEntryInput
): { kind: "allow" } | { kind: "redirect"; href: string } {
  const pathname = input.pathname || "";
  if (SESSION_PATHS.has(pathname)) return { kind: "allow" };

  const permissions = [...input.permissions];
  const roleCodes = [...(input.roleCodes ?? [])];
  const opened = specializedForDesk({
    tenantId: input.tenantId,
    permissions,
    unitIds: input.unitIds,
    enabledUnitAppIds: input.enabledUnitAppIds,
    roleCodes,
    growthOs: input.growthOs,
  });
  const zone = specializedAppForAdminPath(pathname);

  if (zone && opened.includes(zone)) {
    if (zone === "asuntos-estudiantiles" && !isStudentAffairsAllowedAdminPath(pathname, roleCodes)) {
      return redirectTo(STUDENT_AFFAIRS_HOME_PATH, pathname);
    }
    if (zone === "congreso" && !isCongressAllowedAdminPath(pathname)) {
      return redirectTo(CONGRESS_VARONES_HOME_PATH, pathname);
    }
    return { kind: "allow" };
  }

  if (input.growthOs) {
    if (usesCongressFocusedShell(permissions, roleCodes) && !isCongressAllowedAdminPath(pathname)) {
      return redirectTo(CONGRESS_VARONES_HOME_PATH, pathname);
    }
    if (
      usesStudentAffairsFocusedShell(permissions, false, roleCodes) &&
      !isStudentAffairsAllowedAdminPath(pathname, roleCodes)
    ) {
      return redirectTo(STUDENT_AFFAIRS_HOME_PATH, pathname);
    }
    if (zone) return redirectTo("/admin", pathname);
    return { kind: "allow" };
  }

  return redirectTo(homeOf(opened), pathname);
}

function homeOf(opened: readonly SpecializedAppId[]): string {
  if (opened.length !== 1) return "/escritorio";
  const open = manifestById(opened[0]).open;
  return open.type === "internal" ? open.href : "/escritorio";
}

function redirectTo(
  href: string,
  pathname: string
): { kind: "redirect"; href: string } {
  if (href === pathname) return { kind: "redirect", href: "/escritorio" };
  return { kind: "redirect", href };
}
