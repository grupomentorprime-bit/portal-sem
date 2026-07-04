import "server-only";

import type { IdentityRole, IdentityUser } from "@/types/identity";
import {
  canAssignRole,
  canManageMember,
  canViewMember,
  denySuperAdminTarget,
} from "@/core/identity/roles/hierarchy";
import { ROLE_CODES, type RoleCode } from "@/core/identity/roles/codes";
import { isProtectedMember, resolveRoleCodeFromRef } from "@/core/identity/roles/helpers";
import { getRoleCode, getCallerRoleCode } from "@/lib/identity/roles";
import { getInstitutionalRoleLabel } from "@/lib/admin/institutional";
import { getAssignableRoleCodes } from "@/core/identity/roles/hierarchy";
import { writeAudit } from "@/lib/identity/audit";

export const SUPER_ADMIN_BOOTSTRAP_EMAIL = "soporte@mentorprime.cl";

export function isSystemAccountUser(user: Pick<IdentityUser, "email" | "isSystemAccount">): boolean {
  if (user.isSystemAccount === true) return true;
  return user.email.toLowerCase().trim() === SUPER_ADMIN_BOOTSTRAP_EMAIL;
}

export async function ensureSuperAdminMembershipForEmail(
  email: string,
  tenantId: string,
  userId: string
): Promise<void> {
  if (email.toLowerCase().trim() !== SUPER_ADMIN_BOOTSTRAP_EMAIL) return;
  const { ensureSuperAdminMembership } = await import("@/lib/identity/roles");
  const { markUserAsSystemAccount } = await import("@/lib/identity/users");
  await markUserAsSystemAccount(userId);
  await ensureSuperAdminMembership(tenantId, userId);
}

export async function getCallerRoleCodeFromContext(
  tenantId: string,
  roleIds: string[]
): Promise<RoleCode | null> {
  return getCallerRoleCode(tenantId, roleIds);
}

export function getTargetRoleCode(roles: IdentityRole[]): RoleCode | null {
  if (!roles.length) return null;
  const codes = roles.map(getRoleCode).filter(Boolean) as RoleCode[];
  if (codes.includes(ROLE_CODES.SUPER_ADMIN)) return ROLE_CODES.SUPER_ADMIN;
  if (codes.includes(ROLE_CODES.INSTITUTION_ADMIN)) return ROLE_CODES.INSTITUTION_ADMIN;
  if (codes.includes(ROLE_CODES.SUPPORT)) return ROLE_CODES.SUPPORT;
  return codes[0] ?? null;
}

export function shouldHideMemberFromCaller(
  callerCode: RoleCode | null,
  targetCode: RoleCode | null,
  user?: Pick<IdentityUser, "email" | "isSystemAccount"> | null
): boolean {
  if (user && isSystemAccountUser(user) && callerCode !== ROLE_CODES.SUPER_ADMIN) {
    return true;
  }
  if (targetCode === ROLE_CODES.SUPER_ADMIN && callerCode !== ROLE_CODES.SUPER_ADMIN) {
    return true;
  }
  return !canViewMember(callerCode, targetCode);
}

export async function auditIamDenied(input: {
  tenantId: string;
  actorUserId: string;
  actorRoleCode: RoleCode | null;
  action: string;
  targetRoleCode: RoleCode | null;
  targetUserId?: string;
  reason: string;
}): Promise<void> {
  await writeAudit({
    tenantId: input.tenantId,
    userId: input.actorUserId,
    action: "iam.denied",
    entity: "membership",
    entityId: input.targetUserId,
    metadata: {
      attemptedAction: input.action,
      actorRole: input.actorRoleCode,
      targetRole: input.targetRoleCode,
      result: "DENIED",
      reason: input.reason,
    },
  });
}

export function assertCanViewMember(
  callerCode: RoleCode | null,
  targetCode: RoleCode | null
): { ok: true } | { ok: false; error: string; auditReason: string } {
  if (!canViewMember(callerCode, targetCode)) {
    return {
      ok: false,
      error: "No tienes permiso para ver este usuario.",
      auditReason: "view_denied_by_hierarchy",
    };
  }
  return { ok: true };
}

export function assertCanManageMember(
  callerCode: RoleCode | null,
  targetCode: RoleCode | null,
  options?: { isSystemAccount?: boolean }
): { ok: true } | { ok: false; error: string; auditReason: string } {
  if (options?.isSystemAccount || denySuperAdminTarget(targetCode)) {
    return {
      ok: false,
      error: "No se puede modificar al Super Admin.",
      auditReason: "protected_system_account",
    };
  }
  if (!canManageMember(callerCode, targetCode)) {
    return {
      ok: false,
      error: "No tienes permiso para modificar este usuario.",
      auditReason: "manage_denied_by_hierarchy",
    };
  }
  return { ok: true };
}

export function assertCanAssignRole(
  callerCode: RoleCode | null,
  newRoleCode: RoleCode | null
): { ok: true } | { ok: false; error: string; auditReason: string } {
  if (denySuperAdminTarget(newRoleCode)) {
    return {
      ok: false,
      error: "No se puede asignar el rol Super Admin.",
      auditReason: "assign_super_admin_denied",
    };
  }
  if (!canAssignRole(callerCode, newRoleCode)) {
    return {
      ok: false,
      error: "No tienes permiso para asignar este rol.",
      auditReason: "assign_denied_by_hierarchy",
    };
  }
  return { ok: true };
}

export function buildAssignableRolesList(
  callerCode: RoleCode | null,
  allRoles: IdentityRole[]
): Array<{ id: string; name: string; code: string; label: string }> {
  const assignableCodes = getAssignableRoleCodes(callerCode);
  return allRoles
    .filter((role) => {
      const code = getRoleCode(role);
      return code && assignableCodes.includes(code as (typeof assignableCodes)[number]);
    })
    .map((role) => {
      const code = getRoleCode(role)!;
      return {
        id: role._id,
        name: role.name,
        code,
        label: getInstitutionalRoleLabel(code),
      };
    });
}

/** Filtra miembros con roles en formato API — oculta Super Admin y cuentas de sistema */
export function filterVisibleMembers<T extends { roles: Array<{ code?: string; name?: string }> }>(
  members: T[],
  callerCode: RoleCode | null,
  userMap?: Map<string, Pick<IdentityUser, "email" | "isSystemAccount">>,
  getUserId?: (member: T) => string
): T[] {
  return members.filter((member) => {
    const targetCode = resolveRoleCodeFromRef(member.roles[0]) ?? getTargetRoleCodeFromRefs(member.roles);
    const user = getUserId && userMap ? userMap.get(getUserId(member)) : undefined;
    return !shouldHideMemberFromCaller(callerCode, targetCode, user);
  });
}

function getTargetRoleCodeFromRefs(roles: Array<{ code?: string; name?: string }>): RoleCode | null {
  for (const role of roles) {
    const code = resolveRoleCodeFromRef(role);
    if (code === ROLE_CODES.SUPER_ADMIN) return ROLE_CODES.SUPER_ADMIN;
    if (code === ROLE_CODES.INSTITUTION_ADMIN) return ROLE_CODES.INSTITUTION_ADMIN;
    if (code === ROLE_CODES.SUPPORT) return ROLE_CODES.SUPPORT;
    if (code) return code;
  }
  return null;
}

export { isProtectedMember, resolveRoleCodeFromRef };
