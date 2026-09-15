import "server-only";

import {
  isSpaceAdministratorRole,
  LAST_SPACE_ADMIN_ERROR,
  wouldLeaveWithoutSpaceAdmin,
} from "@/core/identity/policies/last-admin";
import { listMembershipsByTenant } from "@/lib/identity/memberships";
import { findRolesByIds } from "@/lib/identity/roles";
import { getTargetRoleCode } from "@/lib/identity/iam-guard";

export {
  isSpaceAdministratorRole,
  LAST_SPACE_ADMIN_ERROR,
  SPACE_ADMIN_MIN_LEVEL,
  wouldLeaveWithoutSpaceAdmin,
} from "@/core/identity/policies/last-admin";

export async function listActiveSpaceAdminMembershipIds(
  tenantId: string
): Promise<string[]> {
  const memberships = await listMembershipsByTenant(tenantId);
  const active = memberships.filter((m) => m.status === "active");
  if (active.length === 0) return [];

  const roleIds = [...new Set(active.flatMap((m) => m.roleIds))];
  const roles = await findRolesByIds(tenantId, roleIds);
  const roleMap = new Map(roles.map((r) => [r._id, r]));

  const adminIds: string[] = [];
  for (const membership of active) {
    const memberRoles = membership.roleIds
      .map((id) => roleMap.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    const code = getTargetRoleCode(memberRoles);
    if (isSpaceAdministratorRole(code)) {
      adminIds.push(membership._id);
    }
  }
  return adminIds;
}

export async function assertSpaceKeepsAdministrator(input: {
  tenantId: string;
  membershipId: string;
  /** Tras la operación, ¿esta membership sigue siendo admin activo del Espacio? */
  remainsActiveAdmin: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const activeAdminMembershipIds = await listActiveSpaceAdminMembershipIds(input.tenantId);
  if (
    wouldLeaveWithoutSpaceAdmin({
      activeAdminMembershipIds,
      membershipId: input.membershipId,
      membershipRemainsAdmin: input.remainsActiveAdmin,
    })
  ) {
    return { ok: false, error: LAST_SPACE_ADMIN_ERROR };
  }
  return { ok: true };
}
