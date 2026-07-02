import "server-only";

import { Resend } from "resend";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import { getAppBaseUrl } from "@/lib/app-url";

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
  const keycloakOnly = isKeycloakOnlyAuth();
  const loginUrl = `${baseUrl}/admin/login`;
  const expiresLabel = new Date(input.expiresAt).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const html = keycloakOnly
    ? `
      <div>
        <h1>Hola, ${escapeHtml(input.displayName)}</h1>
        <p>
          Te invitaron a acceder al centro de administración de <strong>${escapeHtml(institution)}</strong>.
        </p>
        <p>
          Inicia sesión con tu cuenta institucional usando el mismo correo
          (<strong>${escapeHtml(input.to)}</strong>). La invitación es válida hasta
          <strong>${escapeHtml(expiresLabel)}</strong>.
        </p>
        <p>
          <a href="${loginUrl}">Ingresar al CMS</a>
        </p>
        <p>
          Si el enlace no funciona, copia y pega esta URL en tu navegador:<br />
          ${loginUrl}
        </p>
      </div>
    `
    : `
      <div>
        <h1>Hola, ${escapeHtml(input.displayName)}</h1>
        <p>
          Te invitaron a acceder al centro de administración de <strong>${escapeHtml(institution)}</strong>.
        </p>
        <p>
          Crea tu contraseña con el enlace siguiente. El enlace es válido hasta
          <strong>${escapeHtml(expiresLabel)}</strong> (15 minutos).
        </p>
        <p>
          <a href="${baseUrl}/invite/${encodeURIComponent(input.token)}">Crear mi contraseña</a>
        </p>
        <p>
          Si el enlace no funciona, copia y pega esta URL en tu navegador:<br />
          ${baseUrl}/invite/${encodeURIComponent(input.token)}
        </p>
      </div>
    `;

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
