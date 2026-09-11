import {
  PLATFORM_ROLE_CODES,
  normalizePlatformRoles,
  type PlatformRoleCode,
} from "@/core/identity/platform/codes";

export type PlatformAccessReason = "ok" | "unauthenticated" | "denied";

export interface PlatformAccessDecision {
  allowed: boolean;
  reason: PlatformAccessReason;
  platformRoles: PlatformRoleCode[];
}

type PlatformCapabilityUser = {
  platformRoles?: unknown;
  status?: string;
};

/**
 * Capacidad global: solo `identity_users.platformRoles`.
 * No usa membresía, Espacio activo, `super_admin`, email ni `isSystemAccount`.
 */
export function readPlatformRoles(
  user: PlatformCapabilityUser | null | undefined
): PlatformRoleCode[] {
  if (!user) return [];
  return normalizePlatformRoles(user.platformRoles);
}

export function hasPlatformOperatorCapability(
  user: PlatformCapabilityUser | null | undefined
): boolean {
  if (!user) return false;
  if (user.status && user.status !== "active") return false;
  const roles = readPlatformRoles(user);
  return (
    roles.includes(PLATFORM_ROLE_CODES.OWNER) ||
    roles.includes(PLATFORM_ROLE_CODES.OPERATOR)
  );
}

/**
 * Decisión deny-by-default, independiente del Espacio activo.
 * `membership` y `activeTenantId` se aceptan para que los tests prueben que se ignoran.
 */
export function evaluatePlatformOperatorAccess(input: {
  user: PlatformCapabilityUser | null | undefined;
  session: unknown | null | undefined;
  membership?: unknown;
  activeTenantId?: string | null;
}): PlatformAccessDecision {
  void input.membership;
  void input.activeTenantId;

  if (!input.session || !input.user) {
    return { allowed: false, reason: "unauthenticated", platformRoles: [] };
  }

  const platformRoles = readPlatformRoles(input.user);
  if (!hasPlatformOperatorCapability(input.user)) {
    return { allowed: false, reason: "denied", platformRoles };
  }

  return { allowed: true, reason: "ok", platformRoles };
}
