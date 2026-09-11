import "server-only";

import { logServerError } from "@/core/security/redact";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import {
  renderSteps,
  renderTransactionalEmail,
} from "@/lib/notifications/email-layout";
import {
  emailAbsoluteUrl,
  type EmailIdentity,
} from "@/lib/notifications/identity";
import { resolveEmailIdentityForTenant } from "@/lib/notifications/resolve-identity";
import {
  formatFromHeader,
  getResendClient,
  getTechnicalMailbox,
} from "@/lib/notifications/transport";

export type { EmailIdentity } from "@/lib/notifications/identity";

export interface InvitationEmailInput {
  tenantId: string;
  to: string;
  displayName: string;
  token: string;
  expiresAt: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInvitationEmail(input: {
  identity: EmailIdentity;
  displayName: string;
  token: string;
  expiresAt: string;
}): { subject: string; html: string } {
  const institution = input.identity.displayName;
  const inviteUrl = emailAbsoluteUrl(
    input.identity,
    `/invite/${encodeURIComponent(input.token)}`
  );
  const expiresLabel = new Date(input.expiresAt).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const keycloakOnly = isKeycloakOnlyAuth();
  const validityNote = keycloakOnly
    ? `El enlace es válido hasta <strong>${escapeHtml(expiresLabel)}</strong>.`
    : `El enlace es válido hasta <strong>${escapeHtml(expiresLabel)}</strong> (15 minutos).`;

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      Te invitaron a administrar el Espacio <strong>${escapeHtml(institution)}</strong>.
    </p>
    <p style="margin:0 0 16px;">
      Crea tu contraseña con el enlace siguiente. ${validityNote}
    </p>
    ${renderSteps([
      "Abre el enlace de invitación.",
      "Define tu contraseña de acceso.",
      "Entra al centro de administración con tu correo y la contraseña que creaste.",
    ])}
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText: `Crea tu contraseña para acceder a ${institution}.`,
    headline: "Completa tu acceso",
    greeting: `Hola, ${input.displayName}`,
    bodyHtml,
    ctaLabel: "Crear mi contraseña",
    ctaUrl: inviteUrl,
    footerNote: keycloakOnly
      ? "Si no reconoces esta invitación, contacta a quien administra el Espacio."
      : "Este enlace expira en 15 minutos por seguridad.",
  });

  return {
    subject: `Invitación — ${institution}`,
    html,
  };
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const { subject, html } = renderInvitationEmail({
    identity,
    displayName: input.displayName,
    token: input.token,
    expiresAt: input.expiresAt,
  });

  return sendTransactionalHtmlEmail({
    to: input.to,
    subject,
    html,
    identity,
  });
}

export async function sendTransactionalHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  identity: EmailIdentity;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "El correo transaccional no está configurado." };
  }

  const { data, error } = await resend.emails.send({
    from: formatFromHeader(input.identity.displayName, getTechnicalMailbox()),
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.identity.replyTo ? { replyTo: input.identity.replyTo } : {}),
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
  });

  if (error) {
    logServerError("email", error);
    return { ok: false, error: "No se pudo enviar el correo." };
  }

  return { ok: true, id: data?.id };
}
