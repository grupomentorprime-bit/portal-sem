/**
 * OT-IAM-002 — Resolución de permisos efectivos.
 * Rol → plantilla → overrides → techo jerárquico → permisos legacy (compat).
 */

import type { IdentityMembership, IdentityRole } from "@/types/identity";
import type { RoleCode } from "@/core/identity/roles/codes";
import {
  ALL_CATALOG_PERMISSION_CODES,
  LEGACY_TO_GRANULAR,
  getPermissionDefinition,
} from "@/core/identity/permissions/catalog";
import {
  getRolePermissionCeiling,
  mergeRolePermissionMaps,
  type PermissionMap,
} from "@/core/identity/permissions/role-templates";
import { getRoleCode } from "@/lib/identity/roles";

export type PermissionOrigin = "role" | "override" | "denied";

export interface ResolvedPermission {
  code: string;
  allowed: boolean;
  origin: PermissionOrigin;
  roleAllowed: boolean;
  overrideAllowed?: boolean;
}

export interface PermissionResolutionResult {
  effective: PermissionMap;
  resolved: ResolvedPermission[];
  legacyPermissions: string[];
}

export function resolveRolePermissionMap(role: IdentityRole): PermissionMap {
  if (role.permissionMap && Object.keys(role.permissionMap).length > 0) {
    return normalizePermissionMap(role.permissionMap);
  }
  return legacyPermissionIdsToMap(role.permissionIds);
}

export function legacyPermissionIdsToMap(permissionIds: string[]): PermissionMap {
  const map: PermissionMap = {};
  for (const code of ALL_CATALOG_PERMISSION_CODES) map[code] = false;
  for (const legacyId of permissionIds) {
    const granular = LEGACY_TO_GRANULAR.get(legacyId) ?? [];
    if (granular.length === 0) {
      if (ALL_CATALOG_PERMISSION_CODES.includes(legacyId)) map[legacyId] = true;
      continue;
    }
    for (const code of granular) map[code] = true;
  }
  return map;
}

export function normalizePermissionMap(input: Record<string, boolean>): PermissionMap {
  const map: PermissionMap = {};
  for (const code of ALL_CATALOG_PERMISSION_CODES) {
    map[code] = input[code] === true;
  }
  return map;
}

export function resolveMembershipPermissions(input: {
  roles: IdentityRole[];
  membership?: IdentityMembership | null;
  roleCode: RoleCode | null;
}): PermissionResolutionResult {
  const roleMaps = input.roles.map(resolveRolePermissionMap);
  const roleBase = mergeRolePermissionMaps(roleMaps);
  const overrides = input.membership?.permissionOverrides ?? {};
  const ceiling = getRolePermissionCeiling(input.roleCode);

  const effective: PermissionMap = {};
  const resolved: ResolvedPermission[] = [];

  for (const code of ALL_CATALOG_PERMISSION_CODES) {
    const roleAllowed = roleBase[code] === true;
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, code);
    const overrideValue = hasOverride ? overrides[code] === true : undefined;

    let allowed = roleAllowed;
    let origin: PermissionOrigin = roleAllowed ? "role" : "denied";

    if (hasOverride) {
      allowed = overrideValue === true;
      origin = "override";
    }

    if (allowed && ceiling[code] !== true) {
      allowed = false;
      origin = "denied";
    }

    effective[code] = allowed;
    resolved.push({
      code,
      allowed,
      origin,
      roleAllowed,
      overrideAllowed: hasOverride ? overrideValue : undefined,
    });
  }

  const legacyPermissions = granularToLegacyPermissions(effective);

  return { effective, resolved, legacyPermissions };
}

export function granularToLegacyPermissions(effective: PermissionMap): string[] {
  const legacy = new Set<string>();

  for (const [legacyId, granularCodes] of LEGACY_TO_GRANULAR.entries()) {
    if (granularCodes.some((code) => effective[code] === true)) {
      legacy.add(legacyId);
    }
  }

  for (const code of ALL_CATALOG_PERMISSION_CODES) {
    if (effective[code] !== true) continue;
    const def = getPermissionDefinition(code);
    for (const legacyId of def?.impliesLegacy ?? []) legacy.add(legacyId);
  }

  return [...legacy].sort();
}

export function canGrantPermissionOverride(
  roleCode: RoleCode | null,
  permissionCode: string,
  allowed: boolean
): boolean {
  if (!allowed) return true;
  const ceiling = getRolePermissionCeiling(roleCode);
  return ceiling[permissionCode] === true;
}

export function sanitizePermissionOverrides(
  roleCode: RoleCode | null,
  overrides: Record<string, boolean>
): Record<string, boolean> {
  const ceiling = getRolePermissionCeiling(roleCode);
  const sanitized: Record<string, boolean> = {};
  for (const [code, allowed] of Object.entries(overrides)) {
    if (!ALL_CATALOG_PERMISSION_CODES.includes(code)) continue;
    if (allowed === true && ceiling[code] !== true) continue;
    sanitized[code] = allowed;
  }
  return sanitized;
}
