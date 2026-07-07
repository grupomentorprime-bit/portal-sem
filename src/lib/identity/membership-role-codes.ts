import "server-only";

import { loadSessionContext } from "@/lib/identity/sessions";
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

/** Incluye sesión real en compat mode (localhost) para aplicar restricciones por rol. */
export async function resolveEffectiveRoleCodes(ctx: AuthContext): Promise<string[]> {
  const fromContext = await resolveAuthRoleCodes(ctx);
  if (fromContext.length > 0) return fromContext;
  if (!ctx.compatMode) return [];
  const loaded = await loadSessionContext();
  if (!loaded?.membership) return [];
  return resolveMembershipRoleCodes(loaded.session.tenantId, loaded.membership);
}
