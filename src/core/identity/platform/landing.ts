import { PLATFORM_ADMIN_HOME } from "@/core/identity/platform/codes";

const SPACE_HOME = "/admin";
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
    pathOnly === "/admin/config" ||
    pathOnly === NO_SPACE_PATH
  );
}

/**
 * Destino post-login (única función de entrada tras autenticar).
 *
 * Prioridad:
 * 1. Operador de plataforma (`platformRoles`) → `/platform`
 *    (incluso con membresías SEM/ADL; no se infiere por email/tenant/rol SEM)
 * 2. Usuario sin Espacio → `/admin/sin-espacio`
 * 3. Usuario con Espacio(s) → `/admin` (o `next` profundo no-default);
 *    el Espacio activo lo resuelve `resolveActiveTenantForUser` / picker existente
 *
 * `next=/platform…` solo se honra si el usuario es operador.
 */
export function resolvePostAuthDestination(input: {
  hasSpace: boolean;
  isPlatformOperator: boolean;
  next?: string | null;
}): string {
  const next = sanitizeNext(input.next);
  const nextPath = next?.split("?")[0] ?? "";

  if (nextPath.startsWith(PLATFORM_ADMIN_HOME)) {
    return input.isPlatformOperator ? next! : input.hasSpace ? SPACE_HOME : NO_SPACE_PATH;
  }

  // Operador: siempre Growth OS Master, con o sin membresía de cliente.
  if (input.isPlatformOperator) {
    return PLATFORM_ADMIN_HOME;
  }

  if (!input.hasSpace) {
    return NO_SPACE_PATH;
  }

  if (next && !isDefaultSpaceLanding(next)) {
    return next;
  }

  return SPACE_HOME;
}
