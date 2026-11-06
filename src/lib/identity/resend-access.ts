import "server-only";

import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { keycloakUserNeedsPassword } from "@/lib/identity/keycloak-admin";
import {
  createInvitation,
  findPendingInvitationByEmail,
  findInvitationById,
  renewInvitationToken,
} from "@/lib/identity/invitations";
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
}): Promise<SendResult> {
  const sent = await sendInvitationEmail({
    tenantId: input.tenantId,
    to: input.email,
    displayName: input.displayName || input.email,
    token: input.token,
    expiresAt: input.expiresAt,
  });
  if (!sent.ok) return { ok: false, error: sent.error, status: 502 };
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

  return deliverInvitationEmail({
    tenantId: input.tenantId,
    email: renewed.email,
    displayName: renewed.displayName,
    token: renewed.token,
    expiresAt: renewed.expiresAt,
    message: `Reenviamos la invitación corporativa a ${renewed.email}. El enlace anterior ya no sirve.`,
  });
}

/**
 * Persona del Equipo: correo corporativo para entrar.
 * Si todavía no tiene contraseña, el correo incluye el enlace para crearla.
 */
export async function resendMemberAccessEmail(input: {
  tenantId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  invitedBy: string;
}): Promise<SendResult> {
  const email = normalizeEmail(input.email);
  if (!email) {
    return { ok: false, error: "Esta persona no tiene un correo.", status: 400 };
  }

  const displayName = input.displayName.trim() || email;
  const needsPassword = isKeycloakOnlyAuth()
    ? await keycloakUserNeedsPassword(email)
    : false;

  if (!needsPassword) {
    const sent = await sendAccessReminderEmail({
      tenantId: input.tenantId,
      to: email,
      displayName,
    });
    if (!sent.ok) return { ok: false, error: sent.error, status: 502 };
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
    message: `Enviamos el correo corporativo para crear la contraseña a ${invitation.email}.`,
  });
}
