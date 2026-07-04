/** Utilidades de rol compartidas (cliente y servidor) — comparar siempre por código oficial */

import {
  LEGACY_ROLE_NAME_TO_CODE,
  PORTAL_ROLE_CODES,
  ERP_ROLE_CODES,
  ROLE_CODES,
  type PortalRoleCode,
  type RoleCode,
} from "@/core/identity/roles/codes";

export interface RoleRef {
  code?: string | null;
  name?: string;
}

/** Códigos de rol que no pueden administrarse desde la UI institucional */
export const PROTECTED_ROLE_CODES: readonly RoleCode[] = [ROLE_CODES.SUPER_ADMIN];

/** Códigos que no pueden asignarse vía invitación o cambio de rol */
export const NON_ASSIGNABLE_ROLE_CODES: readonly RoleCode[] = [ROLE_CODES.SUPER_ADMIN];

export function resolveRoleCodeFromRef(role: RoleRef | string | null | undefined): RoleCode | null {
  if (!role) return null;
  if (typeof role === "string") {
    const trimmed = role.trim();
    if ((PORTAL_ROLE_CODES as string[]).includes(trimmed)) return trimmed as RoleCode;
    if ((ERP_ROLE_CODES as string[]).includes(trimmed)) return trimmed as RoleCode;
    return LEGACY_ROLE_NAME_TO_CODE[trimmed] ?? null;
  }
  if (role.code) {
    const fromCode = resolveRoleCodeFromRef(role.code);
    if (fromCode) return fromCode;
  }
  if (role.name) {
    return LEGACY_ROLE_NAME_TO_CODE[role.name] ?? resolveRoleCodeFromRef(role.name);
  }
  return null;
}

export function roleRefHasCode(role: RoleRef, code: RoleCode): boolean {
  return resolveRoleCodeFromRef(role) === code;
}

export function rolesIncludeCode(roles: RoleRef[], code: RoleCode): boolean {
  return roles.some((role) => roleRefHasCode(role, code));
}

export function isSuperAdminRole(role: RoleRef): boolean {
  return roleRefHasCode(role, ROLE_CODES.SUPER_ADMIN);
}

export function isProtectedRole(role: RoleRef): boolean {
  return isSuperAdminRole(role);
}

export function isProtectedMember(roles: RoleRef[]): boolean {
  return roles.some(isProtectedRole);
}

export function isPortalRoleCode(code: string | null | undefined): code is PortalRoleCode {
  return Boolean(code && (PORTAL_ROLE_CODES as string[]).includes(code));
}

export function isNonAssignableRoleCode(code: RoleCode | null | undefined): boolean {
  return Boolean(code && (NON_ASSIGNABLE_ROLE_CODES as readonly string[]).includes(code));
}
