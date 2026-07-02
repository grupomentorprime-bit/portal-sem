import "server-only";

import { Resend } from "resend";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { getAppBaseUrl } from "@/lib/app-url";
import { renderSteps, renderTransactionalEmail } from "@/lib/notifications/email-layout";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getEmailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Portal SEM <onboarding@resend.dev>"
  );
}

export interface InvitationEmailInput {
  to: string;
  displayName: string;
  token: string;
  institutionName?: string;
  expiresAt: string;
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY no configurada." };
  }

  const baseUrl = getAppBaseUrl();
  const institution = input.institutionName?.trim() || "Portal SEM";
  const inviteUrl = `${baseUrl}/invite/${encodeURIComponent(input.token)}`;
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
      Te invitaron a acceder al centro de administración de <strong>${escapeHtml(institution)}</strong>.
    </p>
    <p style="margin:0 0 16px;">
      Crea tu contraseña con el enlace siguiente. ${validityNote}
    </p>
    ${renderSteps([
      "Abre el enlace de invitación.",
      "Define tu contraseña de acceso.",
      "Ingresa al CMS con tu correo y la contraseña que creaste.",
    ])}
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText: `Crea tu contraseña para acceder al CMS de ${institution}.`,
    headline: "Completa tu acceso",
    greeting: `Hola, ${input.displayName}`,
    bodyHtml,
    ctaLabel: "Crear mi contraseña",
    ctaUrl: inviteUrl,
    footerNote: keycloakOnly
      ? "Si no reconoces esta invitación, contacta al administrador."
      : "Este enlace expira en 15 minutos por seguridad.",
  });

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: `Invitación al CMS — ${institution}`,
    html,
  });

  if (error) {
    console.error("[email] invitation failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

export async function sendTransactionalHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY no configurada." };
  }

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
    })),
  });

  if (error) {
    console.error("[email] transactional send failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
