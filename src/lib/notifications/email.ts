import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { logServerError } from "@/core/security/redact";
import { isKeycloakOnlyAuth } from "@/core/identity/auth/config";
import {
  renderSteps,
  renderTransactionalEmail,
} from "@/lib/notifications/email-layout";
import { GROWTH_LOGIN_PATH } from "@/lib/identity/login-route";
import {
  emailAbsoluteUrl,
  type EmailIdentity,
} from "@/lib/notifications/identity";
import { resolveEmailIdentityForTenant } from "@/lib/notifications/resolve-identity";
import { publicTransactionalEmailError } from "@/lib/notifications/email-errors";
import {
  accessEmailVoice,
  departmentEmailBrand,
  ensureDepartmentLogo,
  invitationEmailVoice,
  recoveryEmailVoice,
  type DepartmentEmailBrand,
} from "@/lib/notifications/email-brand";
import {
  formatFromHeader,
  getResendClient,
  resolveSendingMailbox,
} from "@/lib/notifications/transport";

export type { EmailIdentity } from "@/lib/notifications/identity";

export interface InvitationEmailInput {
  tenantId: string;
  to: string;
  displayName: string;
  token: string;
  expiresAt: string;
  unitIds?: string[];
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
  departmentName?: string;
  logoSrc?: string;
}): { subject: string; html: string } {
  const voice = invitationEmailVoice(input.identity.displayName, input.departmentName);
  const inviteUrl = emailAbsoluteUrl(
    input.identity,
    `/invite/${encodeURIComponent(input.token)}`
  );
  const loginUrl = emailAbsoluteUrl(input.identity, GROWTH_LOGIN_PATH);
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
      ${escapeHtml(voice.lead).replace(
        escapeHtml(voice.label),
        `<strong>${escapeHtml(voice.label)}</strong>`
      )}
    </p>
    <p style="margin:0 0 16px;">
      Crea tu contraseña con el enlace siguiente. ${validityNote}
    </p>
    ${renderSteps([
      "Abre el enlace de invitación.",
      "Define tu contraseña de acceso.",
      `Entra en ${loginUrl} con tu correo y la contraseña que creaste.`,
    ])}
    <p style="margin:16px 0 0;">
      Acceso al sistema (login):
      <a href="${escapeHtml(loginUrl)}" style="color:inherit;font-weight:600;">${escapeHtml(loginUrl)}</a>
    </p>
  `;

  const html = renderTransactionalEmail({
    institutionName: voice.label,
    logoSrc: input.logoSrc,
    previewText: voice.preview,
    headline: "Completa tu acceso",
    greeting: `Hola, ${input.displayName}`,
    bodyHtml,
    ctaLabel: "Crear mi contraseña",
    ctaUrl: inviteUrl,
    footerNote: keycloakOnly
      ? input.departmentName
        ? "Si no reconoces esta invitación, contacta a quien administra el departamento."
        : "Si no reconoces esta invitación, contacta a quien administra el Espacio."
      : "Este enlace expira en 15 minutos por seguridad.",
  });

  return {
    subject: voice.subject,
    html,
  };
}

/** Acceso ya creado: mismo formato corporativo, con enlace para entrar. */
export function renderAccessReminderEmail(input: {
  identity: EmailIdentity;
  displayName: string;
  email: string;
  departmentName?: string;
  logoSrc?: string;
}): { subject: string; html: string } {
  const voice = accessEmailVoice(input.identity.displayName, input.departmentName);
  const loginUrl = emailAbsoluteUrl(input.identity, GROWTH_LOGIN_PATH);

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      ${escapeHtml(voice.lead).replace(
        escapeHtml(voice.label),
        `<strong>${escapeHtml(voice.label)}</strong>`
      )}
    </p>
    <p style="margin:0 0 16px;">
      Entra con el correo <strong>${escapeHtml(input.email)}</strong> y la contraseña que ya definiste.
    </p>
    ${renderSteps([
      "Abre el enlace de acceso.",
      "Inicia sesión con tu correo.",
      input.departmentName
        ? "Entra al centro de administración del departamento."
        : "Entra al centro de administración de este Espacio.",
    ])}
  `;

  const html = renderTransactionalEmail({
    institutionName: voice.label,
    logoSrc: input.logoSrc,
    previewText: voice.preview,
    headline: "Tu acceso",
    greeting: `Hola, ${input.displayName}`,
    bodyHtml,
    ctaLabel: input.departmentName ? "Entrar al departamento" : "Entrar al Espacio",
    ctaUrl: loginUrl,
    footerNote: input.departmentName
      ? "Si no reconoces este correo, contacta a quien administra el departamento."
      : "Si no reconoces este correo, contacta a quien administra el Espacio.",
  });

  return {
    subject: voice.subject,
    html,
  };
}

export async function sendAccessReminderEmail(input: {
  tenantId: string;
  to: string;
  displayName: string;
  unitIds?: string[];
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const department = await loadDepartmentEmail(input.unitIds);
  const { subject, html } = renderAccessReminderEmail({
    identity,
    displayName: input.displayName,
    email: input.to,
    departmentName: department?.brand.name,
    logoSrc: department?.logoSrc,
  });

  return sendTransactionalHtmlEmail({
    to: input.to,
    subject,
    html,
    identity,
    fromName: department?.brand.name,
    unitIds: input.unitIds,
  });
}

export async function sendPasswordRecoveryEmail(input: {
  tenantId: string;
  to: string;
  displayName: string;
  resetUrl: string;
  unitIds?: string[];
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const department = await loadDepartmentEmail(input.unitIds);
  const voice = recoveryEmailVoice(identity.displayName, department?.brand.name);
  const bodyHtml = `
    <p style="margin:0 0 16px;">
      ${escapeHtml(voice.lead).replace(
        escapeHtml(voice.label),
        `<strong>${escapeHtml(voice.label)}</strong>`
      )}
    </p>
    <p style="margin:0 0 16px;">
      El enlace sirve una sola vez. Si no pediste este cambio, ignora el correo.
    </p>
    ${renderSteps([
      "Abre el enlace de recuperación.",
      "Define tu nueva contraseña.",
      department
        ? "Entra al departamento con tu correo y la contraseña nueva."
        : "Entra al Espacio con tu correo y la contraseña nueva.",
    ])}
  `;
  const html = renderTransactionalEmail({
    institutionName: voice.label,
    logoSrc: department?.logoSrc,
    previewText: voice.preview,
    headline: "Crea una nueva contraseña",
    greeting: `Hola, ${input.displayName}`,
    bodyHtml,
    ctaLabel: "Crear nueva contraseña",
    ctaUrl: input.resetUrl,
    footerNote: department
      ? "Si no reconoces este correo, contacta a quien administra el departamento."
      : "Si no reconoces este correo, contacta a quien administra el Espacio.",
  });

  return sendTransactionalHtmlEmail({
    to: input.to,
    subject: voice.subject,
    html,
    identity,
    fromName: department?.brand.name,
    unitIds: input.unitIds,
  });
}

export async function sendInvitationEmail(
  input: InvitationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const department = await loadDepartmentEmail(input.unitIds);
  const { subject, html } = renderInvitationEmail({
    identity,
    displayName: input.displayName,
    token: input.token,
    expiresAt: input.expiresAt,
    departmentName: department?.brand.name,
    logoSrc: department?.logoSrc,
  });

  return sendTransactionalHtmlEmail({
    to: input.to,
    subject,
    html,
    identity,
    fromName: department?.brand.name,
    unitIds: input.unitIds,
  });
}

async function loadDepartmentEmail(unitIds: string[] | undefined): Promise<{
  brand: DepartmentEmailBrand;
  logoSrc?: string;
  attachment?: Array<{ filename: string; content: Buffer; contentId: string }>;
} | null> {
  const brand = departmentEmailBrand(unitIds);
  if (!brand) return null;
  try {
    const content = await readFile(path.join(process.cwd(), "public", brand.logoFile));
    return {
      brand,
      logoSrc: brand.logoSrc,
      attachment: [{ filename: "varones-nacional.png", content, contentId: brand.contentId }],
    };
  } catch (error) {
    logServerError("email", error);
    return { brand };
  }
}

function sendingMailbox(identity: EmailIdentity): string {
  const configured = identity.mailbox?.trim();
  if (configured?.includes("@")) return configured;
  return resolveSendingMailbox({
    tenantId: identity.tenantId,
    siteId: identity.siteId,
    domains: [],
  });
}

export async function sendTransactionalHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  identity: EmailIdentity;
  fromName?: string;
  unitIds?: string[];
  attachments?: Array<{ filename: string; content: Buffer; contentId?: string }>;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "El correo transaccional no está configurado." };
  }

  const department = await loadDepartmentEmail(input.unitIds);
  const html = department?.logoSrc
    ? ensureDepartmentLogo(input.html, {
        name: department.brand.name,
        logoSrc: department.logoSrc,
      })
    : input.html;
  const fromName = input.fromName?.trim() || department?.brand.name || input.identity.displayName;
  const seenIds = new Set(
    (input.attachments ?? []).map((attachment) => attachment.contentId).filter(Boolean)
  );
  const attachments = [
    ...(input.attachments ?? []),
    ...(department?.attachment ?? []).filter((attachment) => !seenIds.has(attachment.contentId)),
  ];

  try {
    const { data, error } = await resend.emails.send(
      {
        from: formatFromHeader(fromName, sendingMailbox(input.identity)),
        to: input.to,
        subject: input.subject,
        html,
        ...(input.identity.replyTo ? { replyTo: input.identity.replyTo } : {}),
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
        })),
      },
      { signal: AbortSignal.timeout(6_000) } as { headers?: HeadersInit }
    );

    if (error) {
      logServerError("email", error);
      return { ok: false, error: publicTransactionalEmailError(error) };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    logServerError("email", error);
    return { ok: false, error: "No se pudo enviar el correo." };
  }
}
