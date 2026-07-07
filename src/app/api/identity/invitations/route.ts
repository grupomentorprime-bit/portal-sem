import { NextResponse } from "next/server";
import { requirePermission } from "@/core/identity";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { createInvitation, findInvitationById, listInvitationsByTenant, revokeInvitation } from "@/lib/identity/invitations";
import { findMembership } from "@/lib/identity/memberships";
import { ensureTenantRoles, findRoleByCode, findRoleByName, getCallerRoleCode, getRoleCode } from "@/lib/identity/roles";
import { writeAudit } from "@/lib/identity/audit";
import { findUserByEmail } from "@/lib/identity/users";
import { assertCanAssignRole, auditIamDenied } from "@/lib/identity/iam-guard";
import { ROLE_CODES, resolveRoleCode, type RoleCode } from "@/core/identity/roles/codes";
import {
  isValidEmail,
  isValidFullName,
  normalizeEmail,
  normalizeFullName,
} from "@/lib/validation/identity";

export async function GET() {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const invitations = await listInvitationsByTenant(ctx.tenantId);
    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as {
      email?: string;
      displayName?: string;
      roleName?: string;
      roleCode?: string;
    };

    const email = body.email?.trim() ?? "";
    const displayName = body.displayName?.trim() ?? "";

    if (!email) {
      return NextResponse.json({ ok: false, error: "El correo es obligatorio." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Ingresa un correo electrónico válido." },
        { status: 400 }
      );
    }
    if (!displayName) {
      return NextResponse.json(
        { ok: false, error: "El nombre completo es obligatorio." },
        { status: 400 }
      );
    }
    if (!isValidFullName(displayName)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ingresa nombre y apellido (mínimo dos palabras).",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      const membership = await findMembership(existingUser._id, ctx.tenantId);
      if (membership) {
        return NextResponse.json(
          { ok: false, error: "Este usuario ya tiene acceso al CMS." },
          { status: 409 }
        );
      }
    }

    await ensureTenantRoles(ctx.tenantId);
    const roleCode = body.roleCode ? resolveRoleCode(body.roleCode) : null;
    const role = roleCode
      ? await findRoleByCode(ctx.tenantId, roleCode)
      : body.roleName
        ? await findRoleByName(ctx.tenantId, body.roleName)
        : await findRoleByCode(ctx.tenantId, ROLE_CODES.COMMUNICATIONS);

    if (!role) {
      return NextResponse.json({ ok: false, error: "Rol no encontrado." }, { status: 400 });
    }

    const callerRoleCode = ctx.membership
      ? await getCallerRoleCode(ctx.tenantId, ctx.membership.roleIds)
      : null;
    const newRoleCode = getRoleCode(role);
    const assignCheck = assertCanAssignRole(callerRoleCode, newRoleCode);
    if (!assignCheck.ok) {
      if (!ctx.compatMode) {
        await auditIamDenied({
          tenantId: ctx.tenantId,
          actorUserId: ctx.user._id,
          actorRoleCode: callerRoleCode,
          action: "user.invite",
          targetRoleCode: newRoleCode,
          reason: assignCheck.auditReason,
        });
      }
      return NextResponse.json({ ok: false, error: assignCheck.error }, { status: 403 });
    }

    const invitation = await createInvitation({
      tenantId: ctx.tenantId,
      email: normalizedEmail,
      displayName: normalizeFullName(displayName),
      roleIds: [role._id],
      invitedBy: ctx.user._id,
    });

    if (isKeycloakOnlyAuth()) {
      const { provisionKeycloakUserForInvite } = await import("@/lib/identity/keycloak-admin");
      const provision = await provisionKeycloakUserForInvite({
        email: normalizedEmail,
        displayName: invitation.displayName,
      });
      if (!provision.ok && provision.code === "keycloak_error") {
        console.error("[invitations] keycloak provision failed", provision.error);
      }
    }

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "user.invite",
        entity: "invitation",
        entityId: invitation._id,
        metadata: { email: normalizedEmail, displayName: invitation.displayName, roleCode: newRoleCode },
      });
    }

    const { publish } = await import("@/core/events/publisher");
    await publish({
      type: "InvitationCreated",
      tenantId: ctx.tenantId,
      entityType: "invitation",
      entityId: invitation._id,
      userId: ctx.user._id,
      payload: {
        email: invitation.email,
        displayName: invitation.displayName,
        token: invitation.token,
        roleIds: invitation.roleIds,
        expiresAt: invitation.expiresAt,
      },
    }).catch(console.error);

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation._id,
        email: invitation.email,
        displayName: invitation.displayName,
        expiresAt: invitation.expiresAt,
        roles: [{ name: role.name }],
      },
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    const status = message.includes("invitación pendiente") ? 409 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requirePermission("settings.team");
    if (ctx instanceof NextResponse) return ctx;

    const body = (await request.json()) as { invitationId?: string };
    const invitationId = body.invitationId?.trim();

    if (!invitationId) {
      return NextResponse.json({ ok: false, error: "ID de invitación obligatorio." }, { status: 400 });
    }

    const invitation = await findInvitationById(invitationId);
    if (!invitation || invitation.tenantId !== ctx.tenantId) {
      return NextResponse.json({ ok: false, error: "Invitación no encontrada." }, { status: 404 });
    }
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { ok: false, error: "Solo se pueden cancelar invitaciones pendientes." },
        { status: 400 }
      );
    }

    await revokeInvitation(invitationId);

    if (!ctx.compatMode) {
      await writeAudit({
        tenantId: ctx.tenantId,
        userId: ctx.user._id,
        action: "user.invite.revoke",
        entity: "invitation",
        entityId: invitationId,
        metadata: { email: invitation.email },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
