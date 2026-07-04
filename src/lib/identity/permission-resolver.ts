import "server-only";

import type { IdentityMembership, IdentityRole } from "@/types/identity";
import type { RoleCode } from "@/core/identity/roles/codes";
import {
  granularToLegacyPermissions,
  resolveMembershipPermissions,
  resolveRolePermissionMap,
  type PermissionResolutionResult,
} from "@/core/identity/permissions/resolver";
import { getDefaultRolePermissionTemplate } from "@/core/identity/permissions/role-templates";
import {
  findRolesByIds,
  getCallerRoleCode,
  getRoleCode,
} from "@/lib/identity/roles";
import { findMembershipById } from "@/lib/identity/memberships";

export async function resolvePermissionsForMembership(
  tenantId: string,
  membership: IdentityMembership
): Promise<string[]> {
  const result = await resolvePermissionDetailsForMembership(tenantId, membership);
  return result.legacyPermissions;
}

export async function resolvePermissionDetailsForMembership(
  tenantId: string,
  membership: IdentityMembership
): Promise<PermissionResolutionResult> {
  const roles = await findRolesByIds(tenantId, membership.roleIds);
  const roleCode = await getCallerRoleCode(tenantId, membership.roleIds);
  return resolveMembershipPermissions({ roles, membership, roleCode });
}

export async function resolvePermissionsForRoles(
  tenantId: string,
  roleIds: string[],
  membership?: IdentityMembership | null
): Promise<string[]> {
  const roles = await findRolesByIds(tenantId, roleIds);
  const roleCode = await getCallerRoleCode(tenantId, roleIds);
  const result = resolveMembershipPermissions({ roles, membership, roleCode });
  return result.legacyPermissions;
}

export function syncLegacyPermissionIdsFromMap(
  permissionMap: Record<string, boolean>
): string[] {
  return granularToLegacyPermissions(permissionMap);
}

export function buildDefaultPermissionMapForRoleCode(roleCode: RoleCode): Record<string, boolean> {
  return getDefaultRolePermissionTemplate(roleCode);
}

export async function getMembershipPermissionState(
  tenantId: string,
  membershipId: string
) {
  const membership = await findMembershipById(membershipId);
  if (!membership || membership.tenantId !== tenantId) return null;

  const roles = await findRolesByIds(tenantId, membership.roleIds);
  const roleCode = await getCallerRoleCode(tenantId, membership.roleIds);
  const primaryRole = roles[0];
  const roleMap = primaryRole ? resolveRolePermissionMap(primaryRole) : {};

  const result = resolveMembershipPermissions({ roles, membership, roleCode });

  return {
    membershipId,
    roleCode,
    roleMap,
    overrides: membership.permissionOverrides ?? {},
    resolved: result.resolved,
    effective: result.effective,
    legacyPermissions: result.legacyPermissions,
    hasOverrides: Boolean(
      membership.permissionOverrides && Object.keys(membership.permissionOverrides).length > 0
    ),
  };
}

export { resolveRolePermissionMap, getRoleCode };
