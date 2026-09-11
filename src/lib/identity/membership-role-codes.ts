import "server-only";

import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import type { AuthContext, IdentityMembership } from "@/types/identity";

export async function resolveMembershipRoleCodes(
  tenantId: string,
  membership: IdentityMembership
): Promise<string[]> {
  if (!membership.roleIds?.length) return [];
  const roles = await findRolesByIds(tenantId, membership.roleIds);
  return roles.map((role) => getRoleCode(role)).filter(Boolean) as string[];
}

export async function resolveAuthRoleCodes(ctx: AuthContext): Promise<string[]> {
  if (!ctx.membership) return [];
  return resolveMembershipRoleCodes(ctx.tenantId, ctx.membership);
}

export async function resolveEffectiveRoleCodes(ctx: AuthContext): Promise<string[]> {
  return resolveAuthRoleCodes(ctx);
}
