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
 * Destino post-login. Operador de Growth OS sin Espacio aterriza en `/platform`,
 * no en el cascarón de un cliente. `next=/platform` solo si tiene la capacidad.
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

  if (!input.hasSpace) {
    return input.isPlatformOperator ? PLATFORM_ADMIN_HOME : NO_SPACE_PATH;
  }

  if (next && !isDefaultSpaceLanding(next)) {
    return next;
  }

  return SPACE_HOME;
}
