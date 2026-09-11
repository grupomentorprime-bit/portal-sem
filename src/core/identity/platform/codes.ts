/**
 * Roles globales de Growth OS — distintos de los roles de Espacio (ROLE_CODES).
 * No viven en identity_roles ni en un Tenant "platform".
 */

export const PLATFORM_ROLE_CODES = {
  OWNER: "platform_owner",
  OPERATOR: "platform_operator",
} as const;

export type PlatformRoleCode =
  (typeof PLATFORM_ROLE_CODES)[keyof typeof PLATFORM_ROLE_CODES];

export const PLATFORM_ROLE_CODE_LIST: readonly PlatformRoleCode[] = [
  PLATFORM_ROLE_CODES.OWNER,
  PLATFORM_ROLE_CODES.OPERATOR,
];

/** Superficie global, separada de `/admin` del cliente. */
export const PLATFORM_ADMIN_HOME = "/platform";

export function isPlatformRoleCode(value: string | null | undefined): value is PlatformRoleCode {
  return (
    value === PLATFORM_ROLE_CODES.OWNER || value === PLATFORM_ROLE_CODES.OPERATOR
  );
}

export function normalizePlatformRoles(input: unknown): PlatformRoleCode[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<PlatformRoleCode>();
  for (const item of input) {
    if (typeof item === "string" && isPlatformRoleCode(item)) {
      unique.add(item);
    }
  }
  return PLATFORM_ROLE_CODE_LIST.filter((code) => unique.has(code));
}
