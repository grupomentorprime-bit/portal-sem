import "server-only";

import { ROLE_CODES } from "@/core/identity/roles/codes";
import { hasPlatformOwnerCapability } from "@/core/identity/platform/capability";
import { findMembership } from "@/lib/identity/memberships";
import { findRolesByIds, getRoleCode } from "@/lib/identity/roles";
import type { IdentityUser } from "@/types/identity";

/**
 * Dueño de la plataforma, o administrador de esa empresa.
 * Solo lee. Entrar, abrir el escritorio o lanzar una aplicación no contrata,
 * no reparte llaves y no pide provisión.
 */
export async function isDeskMaster(user: IdentityUser, tenantId: string): Promise<boolean> {
  if (hasPlatformOwnerCapability(user)) return true;
  const membership = await findMembership(user._id, tenantId);
  if (!membership) return false;
  const roles = await findRolesByIds(tenantId, membership.roleIds);
  return roles.some((role) => {
    const code = getRoleCode(role);
    return code === ROLE_CODES.SUPER_ADMIN || code === ROLE_CODES.INSTITUTION_ADMIN;
  });
}
