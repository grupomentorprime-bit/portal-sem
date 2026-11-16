import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";

const SPACE_HOME = "/admin";
const DESKTOP_HOME = "/escritorio";
const NO_SPACE_PATH = "/admin/sin-espacio";

function sanitizeNext(next: string | null | undefined): string | null {
  const trimmed = next?.trim() ?? "";
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  return trimmed;
}

function isDefaultSpaceLanding(path: string): boolean {
  const pathOnly = path.split("?")[0];
  return (
    pathOnly === SPACE_HOME ||
    pathOnly === DESKTOP_HOME ||
    pathOnly === "/admin/config" ||
    pathOnly === NO_SPACE_PATH
  );
}

/**
 * Destino post-login (única función de entrada tras autenticar).
 *
 * Prioridad:
 * 1. `next=/platform…` solo si es operador de plataforma (`platformRoles`).
 * 2. Operador de plataforma → `/escritorio`
 *    (incluso sin membresía; no se infiere por email/tenant/rol de un Espacio)
 * 3. Usuario sin Espacio → `/admin/sin-espacio`
 * 4. Usuario con Espacio(s) → `/escritorio` (o `next` profundo no-default);
 *    el Espacio activo lo resuelve `resolveActiveTenantForUser` / picker existente
 */
export function resolvePostAuthDestination(input: {
  hasSpace: boolean;
  isPlatformOperator: boolean;
  next?: string | null;
}): string {
  const next = sanitizeNext(input.next);
  const nextPath = next?.split("?")[0] ?? "";

  if (nextPath.startsWith(PLATFORM_ADMIN_HOME)) {
    return input.isPlatformOperator ? next! : input.hasSpace ? DESKTOP_HOME : NO_SPACE_PATH;
  }

  if (nextPath === DESKTOP_HOME) {
    return DESKTOP_HOME;
  }

  // Operador: la mesa. La consola solo si pidió /platform.
  if (input.isPlatformOperator) {
    return DESKTOP_HOME;
  }

  if (!input.hasSpace) {
    return NO_SPACE_PATH;
  }

  if (next && !isDefaultSpaceLanding(next)) {
    return next;
  }

  return DESKTOP_HOME;
}
