import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { writeAudit } from "@/lib/identity/audit";
import {
  findMembershipById,
  updateMembershipRoles,
  updateMembershipStatus,
  deleteMembership,
  archiveMembershipAccess,
} from "@/lib/identity/memberships";
import {
  ensureTenantRoles,
  findRoleByCode,
  findRoleByName,
  findRolesByIds,
  getCallerRoleCode,
  getRoleCode,
} from "@/lib/identity/roles";
import {
  assertCanAssignRole,
  assertCanManageMember,
  auditIamDenied,
  getTargetRoleCode,
  isSystemAccountUser,
} from "@/lib/identity/iam-guard";
import {
  assertSpaceKeepsAdministrator,
  isSpaceAdministratorRole,
  LAST_SPACE_ADMIN_ERROR,
} from "@/lib/identity/last-admin";
import { findUserById, updateUserStatus } from "@/lib/identity/users";
import {
  deleteUserSessions,
  reconcileSessionsAfterSpaceAccessRemoved,
} from "@/lib/identity/sessions";
import { ROLE_CODES, resolveRoleCode, type RoleCode } from "@/core/identity/roles/codes";

interface RouteContext {
  params: Promise<{ membershipId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const membership = await findMembershipById(membershipId);

    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;

    await ensureTenantRoles(ctx.tenantId);
    const currentRoles = await findRolesByIds(ctx.tenantId, membership.roleIds);
    const targetCode = getTargetRoleCode(currentRoles);
    const targetUser = await findUserById(membership.userId);
    const isSystemAccount = targetUser ? isSystemAccountUser(targetUser) : false;

    const manageCheck = assertCanManageMember(callerRoleCode, targetCode, { isSystemAccount });
    if (!manageCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "membership.roles.update",
          targetRoleCode: targetCode,
          targetUserId: membership.userId,
          reason: manageCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: manageCheck.error }, { status: 403 });
    }

    const body = (await request.json()) as { roleName?: string; roleId?: string; roleCode?: string };
    const roleKey = body.roleCode?.trim() || body.roleId?.trim() || body.roleName?.trim();

    if (!roleKey) {
      return NextResponse.json({ ok: false, error: "Rol obligatorio." }, { status: 400 });
    }

    const role = body.roleId
      ? (await findRolesByIds(ctx.tenantId, [body.roleId]))[0] ?? null
      : body.roleCode
        ? await findRoleByCode(ctx.tenantId, resolveRoleCode(body.roleCode) as RoleCode)
        : await findRoleByName(ctx.tenantId, body.roleName!);

    if (!role) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 400 });
    }

    const newRoleCode = getRoleCode(role);
    if (newRoleCode === ROLE_CODES.SUPER_ADMIN) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "membership.roles.update",
          targetRoleCode: ROLE_CODES.SUPER_ADMIN,
          targetUserId: membership.userId,
          reason: "assign_super_admin_denied",
        });
      }
      return NextResponse.json(
        { ok: false, error: "No se puede asignar el rol Dueño del Espacio." },
        { status: 403 }
      );
    }

    const assignCheck = assertCanAssignRole(callerRoleCode, newRoleCode);
    if (!assignCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "membership.roles.update",
          targetRoleCode: newRoleCode,
          targetUserId: membership.userId,
          reason: assignCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: assignCheck.error }, { status: 403 });
    }

    // D4: no degradar el último Dueño/Administrador activo.
    if (
      membership.status === "active" &&
      isSpaceAdministratorRole(targetCode) &&
      !isSpaceAdministratorRole(newRoleCode)
    ) {
      const lastAdmin = await assertSpaceKeepsAdministrator({
        tenantId: ctx.tenantId,
        membershipId,
        remainsActiveAdmin: false,
      });
      if (!lastAdmin.ok) {
        return NextResponse.json(
          { ok: false, error: lastAdmin.error ?? LAST_SPACE_ADMIN_ERROR },
          { status: 409 }
        );
      }
    }

    const updated = await updateMembershipRoles(membershipId, [role._id]);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar el rol." }, { status: 500 });
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "membership.roles.update",
        entity: "membership",
        entityId: membershipId,
        metadata: { roleCode: newRoleCode, targetUserId: membership.userId },
      });
    }

    return NextResponse.json({
      ok: true,
      membership: {
        id: updated._id,
        roleIds: updated.roleIds,
        roleCode: newRoleCode,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/** Acciones legacy (otras superficies). Equipo V1 usa solo `remove-access`. */
const MEMBER_ACTIONS = [
  "suspend",
  "block",
  "archive",
  "restore",
  "remove",
  "remove-access",
] as const;
type MemberAction = (typeof MEMBER_ACTIONS)[number];

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const { membershipId } = await context.params;
    const { searchParams } = new URL(request.url);
    const action = (searchParams.get("action") ?? "remove") as MemberAction;

    if (!MEMBER_ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: "Acción no válida." }, { status: 400 });
    }

    if (ctx.membership?._id === membershipId) {
      return NextResponse.json(
        { ok: false, error: "No puedes modificar tu propio acceso." },
        { status: 403 }
      );
    }

    const membership = await findMembershipById(membershipId);
    if (!membership || membership.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Membresía no encontrada." }, { status: 404 });
    }

    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;

    await ensureTenantRoles(ctx.tenantId);
    const currentRoles = await findRolesByIds(ctx.tenantId, membership.roleIds);
    const targetCode = getTargetRoleCode(currentRoles);
    const targetUser = await findUserById(membership.userId);
    const isSystemAccount = targetUser ? isSystemAccountUser(targetUser) : false;

    const manageCheck = assertCanManageMember(callerRoleCode, targetCode, { isSystemAccount });
    if (!manageCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: `membership.${action}`,
          targetRoleCode: targetCode,
          targetUserId: membership.userId,
          reason: manageCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: manageCheck.error }, { status: 403 });
    }

    if (action === "remove-access") {
      // D2 + D4: solo membership de este Espacio; sin block / sin user.status; guarda último admin.
      if (membership.status === "active" && isSpaceAdministratorRole(targetCode)) {
        const lastAdmin = await assertSpaceKeepsAdministrator({
          tenantId: ctx.tenantId,
          membershipId,
          remainsActiveAdmin: false,
        });
        if (!lastAdmin.ok) {
          return NextResponse.json(
            { ok: false, error: lastAdmin.error ?? LAST_SPACE_ADMIN_ERROR },
            { status: 409 }
          );
        }
      }

      await archiveMembershipAccess(membershipId);
      await reconcileSessionsAfterSpaceAccessRemoved(membership.userId, membership.tenantId);

      if (!ctx.compatMode) {
        await writeAudit({
          tenantId: ctx.tenantId,
          userId: ctx.user._id,
          action: "membership.remove-access",
          entity: "membership",
          entityId: membershipId,
          metadata: {
            targetUserId: membership.userId,
            action: "remove-access",
            tenantScoped: true,
            userStatusUntouched: true,
          },
        });
      }

      return NextResponse.json({ ok: true, action: "remove-access" });
    }

    if (action === "suspend") {
      await updateMembershipStatus(membershipId, "suspended");
      await deleteUserSessions(membership.userId);
    } else if (action === "block") {
      // Legacy: cuenta global. Equipo V1 no expone ni usa esta acción.
      await updateUserStatus(membership.userId, "suspended");
      await updateMembershipStatus(membershipId, "suspended");
      await deleteUserSessions(membership.userId);
    } else if (action === "archive") {
      await updateMembershipStatus(membershipId, "archived");
      await deleteUserSessions(membership.userId);
    } else if (action === "restore") {
      if (membership.status !== "archived") {
        return NextResponse.json(
          { ok: false, error: "Solo se pueden restaurar usuarios archivados." },
          { status: 400 }
        );
      }
      await updateMembershipStatus(membershipId, "active");
    } else {
      if (membership.status !== "archived") {
        return NextResponse.json(
          {
            ok: false,
            error: "Debe archivar al usuario antes de eliminarlo del CMS.",
          },
          { status: 400 }
        );
      }
      await deleteMembership(membershipId);
      await deleteUserSessions(membership.userId);
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: `membership.${action}`,
        entity: "membership",
        entityId: membershipId,
        metadata: { targetUserId: membership.userId, action },
      });
    }

    return NextResponse.json({ ok: true, action });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
