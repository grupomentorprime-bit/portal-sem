import { ensureSpecializedCapabilities } from "@/lib/desktop/register-specialized";
import { specializedForDesk } from "@/lib/desktop/specialized";
import {
  focusedShells,
  manifestById,
  routeRulesFor,
  specializedAppForAlias,
  specializedAppForInternalPath,
  type SpecializedAppId,
} from "@/nelzuri";

const SESSION_PATHS = new Set(["/admin/login", "/admin/sin-espacio"]);

/** Ruta de una capacidad, incluido un alias registrado por su dueño. */
export function specializedAppForAdminPath(pathname: string): SpecializedAppId | null {
  return specializedAppForAlias(pathname) ?? specializedAppForInternalPath(pathname);
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
  ensureSpecializedCapabilities();
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
  });
  const zone = specializedAppForAdminPath(pathname);

  if (zone && opened.includes(zone)) {
    const rules = routeRulesFor(zone);
    if (!rules || rules.allowsPath(pathname, roleCodes) !== true) {
      return redirectTo(homeOf([zone]), pathname);
    }
    return { kind: "allow" };
  }

  if (input.growthOs) {
    for (const shell of focusedShells(permissions, roleCodes)) {
      if (shell.rules.allowsPath(pathname, roleCodes) !== true) {
        return redirectTo(shell.home, pathname);
      }
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

function redirectTo(href: string, pathname: string): { kind: "redirect"; href: string } {
  if (href === pathname) return { kind: "redirect", href: "/escritorio" };
  return { kind: "redirect", href };
}
