import { NextResponse } from "next/server";
import { requireAuth } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import { resolveEffectiveRoleCodes } from "@/lib/identity/membership-role-codes";
import { findMembershipById, updateMembershipStudentAffairsScope } from "@/lib/identity/memberships";
import {
  ensureTenantRoles,
  findRolesByIds,
  getCallerRoleCode,
} from "@/lib/identity/roles";
import {
  assertCanManageMember,
  auditIamDenied,
  getTargetRoleCode,
  isSystemAccountUser,
} from "@/lib/identity/iam-guard";
import { findUserById } from "@/lib/identity/users";
import {
  canManageStudentAffairsScope,
  normalizeStudentAffairsScope,
} from "@/lib/student-affairs/scope";
import type { StudentAffairsScope } from "@/types/identity";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAuth();
    if (ctx instanceof NextResponse) return ctx;

    const roleCodes = await resolveEffectiveRoleCodes(ctx);
    if (!canManageStudentAffairsScope(ctx, roleCodes)) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);

    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;
    await ensureTenantRoles(ctx.tenantId);
    const memberRoles = await findRolesByIds(ctx.tenantId, membership.roleIds);
    const targetCode = getTargetRoleCode(memberRoles);
    const targetUser = await findUserById(membership.userId);
    const manageCheck = assertCanManageMember(callerRoleCode, targetCode, {
      isSystemAccount: targetUser ? isSystemAccountUser(targetUser) : false,
    });
    if (!manageCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "membership.student_affairs_scope.update",
          targetRoleCode: targetCode,
          targetUserId: membership.userId,
          reason: manageCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: manageCheck.error }, { status: 403 });
    }

    const body = (await request.json()) as { scope?: Partial<StudentAffairsScope> };
    const scope = normalizeStudentAffairsScope(body.scope);

    if (!scope.formIds.length || !scope.generationCodes.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Debe asignar al menos un formulario y una generación.",
        },
        { status: 400 }
      );
    }

    await ensureTenantRoles(ctx.tenantId);
    const updated = await updateMembershipStudentAffairsScope(membershipId, scope);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo guardar el alcance." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.student_affairs_scope.update",
        entity: "membership",
        entityId: membershipId,
        metadata: { formIds: scope.formIds, generationCodes: scope.generationCodes },
      });
    }

    return NextResponse.json({
      ok: true,
      scope: updated.studentAffairsScope ?? scope,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
