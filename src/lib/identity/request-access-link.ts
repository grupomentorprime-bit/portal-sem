import "server-only";

import { assertAccessRequestAllowed } from "@/lib/identity/access-request-rate-limit";
import {
  findPendingInvitationsByEmail,
  renewInvitationToken,
} from "@/lib/identity/invitations";
import { listMembershipsByUser } from "@/lib/identity/memberships";
import { resendMemberAccessEmail } from "@/lib/identity/resend-access";
import { findUserByEmail } from "@/lib/identity/users";
import { unitIdsFromAccess } from "@/lib/notifications/email-brand";
import { sendInvitationEmail } from "@/lib/notifications/email";
import { isValidEmail, normalizeEmail } from "@/lib/validation/identity";

export const ACCESS_LINK_GENERIC_MESSAGE =
  "Si el correo está registrado, enviamos un enlace para crear o renovar tu clave.";

type RequestResult =
  | { ok: true; message: string }
  | { ok: false; error: string; status: number };

export async function requestAccessLink(input: {
  email: string;
  clientKey: string;
}): Promise<RequestResult> {
  const raw = input.email.trim();
  if (!raw || !isValidEmail(raw)) {
    return {
      ok: false,
      error: "Ingresa un correo electrónico válido.",
      status: 400,
    };
  }

  const rate = assertAccessRequestAllowed(input.clientKey);
  if (!rate.ok) {
    return {
      ok: false,
      error: "Espera un momento antes de solicitar otro enlace.",
      status: 429,
    };
  }

  const email = normalizeEmail(raw);

  try {
    const pending = await findPendingInvitationsByEmail(email);
    if (pending.length === 1) {
      const current = pending[0]!;
      const renewed = await renewInvitationToken(current._id, current.tenantId);
      if (renewed?.token) {
        await sendInvitationEmail({
          tenantId: renewed.tenantId,
          to: renewed.email,
          displayName: renewed.displayName || renewed.email,
          token: renewed.token,
          expiresAt: renewed.expiresAt,
          unitIds: unitIdsFromAccess(renewed.unitAccess),
        });
      }
      return { ok: true, message: ACCESS_LINK_GENERIC_MESSAGE };
    }

    const user = await findUserByEmail(email);
    if (user) {
      const memberships = await listMembershipsByUser(user._id);
      if (memberships.length === 1) {
        const membership = memberships[0]!;
        await resendMemberAccessEmail({
          tenantId: membership.tenantId,
          email: user.email,
          displayName: user.displayName || user.email,
          roleIds: membership.roleIds,
          invitedBy: membership.invitedBy ?? membership.userId,
          unitIds:
            membership.unitAccess?.mode === "units"
              ? membership.unitAccess.unitIds
              : undefined,
        });
      }
    }
  } catch (error) {
    console.error("[request-access-link]", error);
  }

  return { ok: true, message: ACCESS_LINK_GENERIC_MESSAGE };
}
