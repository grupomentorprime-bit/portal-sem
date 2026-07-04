import type { ExecutionContext } from "@/types/workflow";
import type { WorkflowTransition } from "@/types/workflow";
import { authorize } from "@/core/identity";

export interface GuardResult {
  ok: boolean;
  error?: string;
}

export async function evaluateGuard(
  ctx: ExecutionContext,
  transition: WorkflowTransition
): Promise<GuardResult> {
  if (ctx.compatMode) return { ok: true };

  if (transition.permission) {
    const authCtx = {
      user: ctx.user,
      session: ctx.session,
      membership: ctx.membership,
      permissions: ctx.permissions,
      tenantId: ctx.tenant,
      compatMode: ctx.compatMode,
    };
    const result = authorize(authCtx, transition.permission);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
  }

  if (!transition.guard) return { ok: true };

  if (transition.guard.startsWith("requireRole:")) {
    const roleName = transition.guard.slice("requireRole:".length);
    const { findRolesByIds } = await import("@/lib/identity/roles");
    if (!ctx.membership) {
      return { ok: false, error: "Sin membresía activa." };
    }
    const roles = await findRolesByIds(ctx.tenant, ctx.membership.roleIds);
    if (!roles.some((r) => r.name === roleName)) {
      return { ok: false, error: `Rol requerido: ${roleName}` };
    }
    return { ok: true };
  }

  if (transition.guard === "requireOwner") {
    const { findRoleByCode } = await import("@/lib/identity/roles");
    const { ROLE_CODES } = await import("@/core/identity/roles/codes");
    const superAdminRole = await findRoleByCode(ctx.tenant, ROLE_CODES.SUPER_ADMIN);
    if (superAdminRole && ctx.membership?.roleIds.includes(superAdminRole._id)) {
      return { ok: true };
    }
    return { ok: false, error: "Se requiere Super Admin." };
  }

  return { ok: true };
}

export function canTransitionGuard(
  ctx: ExecutionContext,
  transition: WorkflowTransition
): boolean {
  if (ctx.compatMode) return true;
  if (transition.permission && !ctx.permissions.includes(transition.permission)) {
    return false;
  }
  return true;
}
