import { NextResponse } from "next/server";
import type { AuthContext } from "@/types/identity";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { findMembershipById, clearMembershipPermissionOverrides, updateMembershipPermissionOverrides } from "@/lib/identity/memberships";
import { findRolesByIds, getCallerRoleCode } from "@/lib/identity/roles";
import { getMembershipPermissionState } from "@/lib/identity/permission-resolver";
import {
  assertCanManageMember,
  auditIamDenied,
  getTargetRoleCode,
  isSystemAccountUser,
} from "@/lib/identity/iam-guard";
import { findUserById } from "@/lib/identity/users";
import { sanitizePermissionOverrides } from "@/core/identity/permissions/resolver";
import { ROLE_CODES } from "@/core/identity/roles/codes";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

async function assertCanEditPermissions(ctx: AuthContext | NextResponse, membershipId: string) {
  if (ctx instanceof NextResponse) return { error: ctx };

  const hasOverridePerm =
    ctx.compatMode ||
    ctx.permissions.includes("identity.permissions.override") ||
    ctx.permissions.includes("identity.roles.manage");

  if (!hasOverridePerm) {
    return {
      error: NextResponse.json(
        { ok: false, error: "No tienes permiso para gestionar permisos personalizados." },
        { status: 403 }
      ),
    };
  }

  const membership = await findMembershipById(membershipId);
  if (!membership || membership.tenantId !== ctx.tenantId) {
    return {
      error: NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 }),
    };
  }

  const callerRoleCode = ctx.membership
    ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
    : null;
  const memberRoles = await findRolesByIds(ctx.tenantId, membership.roleIds);
  const targetCode = getTargetRoleCode(memberRoles);
  const targetUser = await findUserById(membership.userId);
  const isSystemAccount = targetUser ? isSystemAccountUser(targetUser) : false;

  const manageCheck = assertCanManageMember(callerRoleCode, targetCode, { isSystemAccount });
  if (!manageCheck.ok) {
    if (!ctx.compatMode) {
      await auditIamDenied({
        tenantId: ctx.tenantId,
        actorUserId: ctx.user._id,
        actorRoleCode: callerRoleCode,
        action: "membership.permissions.update",
        targetRoleCode: targetCode,
        targetUserId: membership.userId,
        reason: manageCheck.auditReason,
      });
    }
    return {
      error: NextResponse.json({ ok: false, error: manageCheck.error }, { status: 403 }),
    };
  }

  return { membership, callerRoleCode, targetCode };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const check = await assertCanEditPermissions(ctx, membershipId);
    if ("error" in check && check.error) return check.error;

    const state = await getMembershipPermissionState(ctx.tenantId, membershipId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const check = await assertCanEditPermissions(ctx, membershipId);
    if ("error" in check && check.error) return check.error;

    const body = (await request.json()) as { overrides?: Record<string, boolean> };
    const rawOverrides = body.overrides ?? {};
    const sanitized = sanitizePermissionOverrides(check.targetCode ?? null, rawOverrides);

    const updated = await updateMembershipPermissionOverrides(membershipId, sanitized);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudieron guardar los permisos." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.permissions.override",
        entity: "membership",
        entityId: membershipId,
        metadata: { overrides: sanitized, targetUserId: updated.userId },
      });
    }

    const state = await getMembershipPermissionState(ctx.tenantId, membershipId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const check = await assertCanEditPermissions(ctx, membershipId);
    if ("error" in check && check.error) return check.error;

    await clearMembershipPermissionOverrides(membershipId);

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.permissions.reset",
        entity: "membership",
        entityId: membershipId,
        metadata: { targetRoleCode: check.targetCode },
      });
    }

    const state = await getMembershipPermissionState(ctx.tenantId, membershipId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
