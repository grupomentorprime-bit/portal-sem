import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import {
  assertCanManageMember,
  auditIamDenied,
  getTargetRoleCode,
  isSystemAccountUser,
} from "@/lib/identity/iam-guard";
import { findMembershipById } from "@/lib/identity/memberships";
import { resendMemberAccessEmail } from "@/lib/identity/resend-access";
import { findRolesByIds, getCallerRoleCode } from "@/lib/identity/roles";
import { findUserById } from "@/lib/identity/users";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);
    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }
    if (membership.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Esta persona no tiene acceso activo." },
        { status: 400 }
      );
    }

    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;
    const currentRoles = await findRolesByIds(ctx.tenantId, membership.roleIds);
    const targetCode = getTargetRoleCode(currentRoles);
    const targetUser = await findUserById(membership.userId);
    if (!targetUser?.email) {
      return NextResponse.json(
        { ok: false, error: "Esta persona no tiene un correo." },
        { status: 400 }
      );
    }

    const manageCheck = assertCanManageMember(callerRoleCode, targetCode, {
      isSystemAccount: isSystemAccountUser(targetUser),
    });
    if (!manageCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "access.email.resend",
          targetRoleCode: targetCode,
          targetUserId: membership.userId,
          reason: manageCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: manageCheck.error }, { status: 403 });
    }

    const result = await resendMemberAccessEmail({
      tenantId: ctx.tenantId,
      email: targetUser.email,
      displayName: targetUser.displayName || targetUser.email,
      roleIds: membership.roleIds,
      invitedBy: ctx.user._id,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "access.email.resend",
        entity: "membership",
        entityId: membership._id,
        metadata: { email: result.email, targetUserId: targetUser._id },
      });
    }

    return NextResponse.json({ ok: true, email: result.email, message: result.message });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo enviar el correo." },
      { status: 500 }
    );
  }
}
