import "server-only";

import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import {
  createInvitation,
  findPendingInvitationByEmail,
  findInvitationById,
  renewInvitationToken,
} from "@/lib/identity/invitations";
import { unitIdsForDepartmentEmail } from "@/lib/identity/invite-department";
import { sendAccessReminderEmail, sendInvitationEmail } from "@/lib/notifications/email";
import { normalizeEmail } from "@/lib/validation/identity";

type SendResult =
  | { ok: true; email: string; message: string }
  | { ok: false; error: string; status: number };

async function deliverInvitationEmail(input: {
  tenantId: string;
  email: string;
  displayName: string;
  token: string;
  expiresAt: string;
  message: string;
  unitIds?: string[];
}): Promise<SendResult> {
  const sent = await sendInvitationEmail({
    tenantId: input.tenantId,
    to: input.email,
    displayName: input.displayName || input.email,
    token: input.token,
    expiresAt: input.expiresAt,
    unitIds: input.unitIds,
  });
  if (!sent.ok) return { ok: false, error: sent.error, status: 422 };
  return { ok: true, email: input.email, message: input.message };
}

/** Invitación pendiente: nuevo enlace corporativo. El anterior deja de servir. */
export async function resendPendingInvitationEmail(input: {
  tenantId: string;
  invitationId: string;
}): Promise<SendResult> {
  const current = await findInvitationById(input.invitationId, input.tenantId);
  if (!current) {
    return { ok: false, error: "Invitación no encontrada.", status: 404 };
  }
  if (current.status !== "pending") {
    return {
      ok: false,
      error: "Solo se puede reenviar una invitación pendiente.",
      status: 400,
    };
  }

  const renewed = await renewInvitationToken(current._id, input.tenantId);
  if (!renewed?.token) {
    return { ok: false, error: "No se pudo renovar el enlace de acceso.", status: 409 };
  }

  const unitIds = await unitIdsForDepartmentEmail({
    tenantId: input.tenantId,
    roleIds: renewed.roleIds,
    unitAccess: renewed.unitAccess,
    invitationId: renewed._id,
  });

  return deliverInvitationEmail({
    tenantId: input.tenantId,
    email: renewed.email,
    displayName: renewed.displayName,
    token: renewed.token,
    expiresAt: renewed.expiresAt,
    unitIds,
    message: `Reenviamos la invitación corporativa a ${renewed.email}. El enlace anterior ya no sirve.`,
  });
}

/**
 * Persona del Equipo: correo con el enlace para crear o renovar la contraseña.
 */
export async function resendMemberAccessEmail(input: {
  tenantId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  invitedBy: string;
  unitIds?: string[];
}): Promise<SendResult> {
  const email = normalizeEmail(input.email);
  if (!email) {
    return { ok: false, error: "Esta persona no tiene un correo.", status: 400 };
  }

  const displayName = input.displayName.trim() || email;
  const needsPassword = isKeycloakOnlyAuth();
  const unitIds =
    input.unitIds?.length
      ? input.unitIds
      : await unitIdsForDepartmentEmail({
          tenantId: input.tenantId,
          roleIds: input.roleIds,
        });

  if (!needsPassword) {
    const sent = await sendAccessReminderEmail({
      tenantId: input.tenantId,
      to: email,
      displayName,
      unitIds,
    });
    if (!sent.ok) return { ok: false, error: sent.error, status: 422 };
    return {
      ok: true,
      email,
      message: `Enviamos el correo corporativo de acceso a ${email}.`,
    };
  }

  let invitation = await findPendingInvitationByEmail(input.tenantId, email);
  if (invitation) {
    invitation = await renewInvitationToken(invitation._id, input.tenantId);
  } else {
    try {
      invitation = await createInvitation({
        tenantId: input.tenantId,
        email,
        displayName,
        roleIds: input.roleIds,
        invitedBy: input.invitedBy,
        ...(unitIds?.length
          ? { unitAccess: { mode: "units" as const, unitIds } }
          : {}),
      });
    } catch (error) {
      const pending = await findPendingInvitationByEmail(input.tenantId, email);
      invitation = pending
        ? await renewInvitationToken(pending._id, input.tenantId)
        : null;
      if (!invitation) throw error;
    }
  }

  if (!invitation?.token) {
    return { ok: false, error: "No se pudo preparar el correo de acceso.", status: 409 };
  }

  return deliverInvitationEmail({
    tenantId: input.tenantId,
    email: invitation.email,
    displayName: invitation.displayName,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    unitIds:
      (await unitIdsForDepartmentEmail({
        tenantId: input.tenantId,
        roleIds: invitation.roleIds,
        unitAccess: invitation.unitAccess,
        invitationId: invitation._id,
      })) ?? unitIds,
    message: `Enviamos el correo corporativo para crear la contraseña a ${invitation.email}.`,
  });
}
