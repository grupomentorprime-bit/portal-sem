import { MENTOR_APPS, isMentorAppId, type MentorAppId } from "@/lib/desktop/catalog";

/**
 * Llaves de aplicación por membresía.
 * El techo (contracted) lo marca Plataforma. La llave (authorized) la reparte el admin del Espacio.
 */

export function parseAuthorizedApps(value: unknown): MentorAppId[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  const ids: MentorAppId[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !isMentorAppId(item)) return null;
    if (!ids.includes(item)) ids.push(item);
  }
  return MENTOR_APPS.filter((id) => ids.includes(id));
}

/** Intersección techo ∩ llave. Sin campo de llave (legado): todo el techo. */
export function resolveAuthorizedApps(input: {
  contracted: readonly MentorAppId[];
  authorizedApps?: readonly MentorAppId[] | null;
}): MentorAppId[] {
  const contracted = MENTOR_APPS.filter((id) => input.contracted.includes(id));
  if (input.authorizedApps == null) return [...contracted];
  return contracted.filter((id) => input.authorizedApps!.includes(id));
}

export function hasAppKey(
  appId: MentorAppId,
  input: {
    contracted: readonly MentorAppId[];
    authorizedApps?: readonly MentorAppId[] | null;
  }
): boolean {
  return resolveAuthorizedApps(input).includes(appId);
}

/**
 * Iconos en la mesa:
 * - con llave y en el plan → visibles
 * - fuera del plan → solo si puede solicitar (admin del Espacio)
 * - en el plan sin llave → ocultos
 */
export function desktopVisibleApps(input: {
  contracted: readonly MentorAppId[];
  authorizedApps?: readonly MentorAppId[] | null;
  canRequestPlan: boolean;
}): MentorAppId[] {
  const keys = new Set(resolveAuthorizedApps(input));
  const contracted = new Set(MENTOR_APPS.filter((id) => input.contracted.includes(id)));
  return MENTOR_APPS.filter((id) => {
    if (keys.has(id)) return true;
    if (!contracted.has(id) && input.canRequestPlan) return true;
    return false;
  });
}

/** Migración: materializa el acceso que ya existía (solo el techo de ese momento). */
export function migrationAuthorizedApps(contracted: readonly MentorAppId[]): MentorAppId[] {
  return MENTOR_APPS.filter((id) => contracted.includes(id));
}

/**
 * Parche de llaves desde NELZURI. Solo acepta apps del techo.
 * Lista vacía = ninguna llave (explícito).
 */
export function parseAuthorizedAppsPatch(input: {
  authorizedApps: unknown;
  contracted: readonly MentorAppId[];
}): { ok: true; authorizedApps: MentorAppId[] } | { ok: false } {
  const parsed = parseAuthorizedApps(input.authorizedApps);
  if (parsed == null) return { ok: false };
  const contracted = new Set(MENTOR_APPS.filter((id) => input.contracted.includes(id)));
  if (parsed.some((id) => !contracted.has(id))) return { ok: false };
  return { ok: true, authorizedApps: parsed };
}

export function canManageAppKeys(permissions: readonly string[]): boolean {
  return permissions.includes("settings.team");
}
