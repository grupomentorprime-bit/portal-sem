import "server-only";

import { displayBrotherName } from "@/core/congress/brother-name";
import { IPN_CHILE_VARONES } from "@/core/units/ipn-chile";
import { resolvePublicUrl } from "@/lib/app-url";
import { QUILICURA_NAZARETH_VENUE } from "@/lib/experience/forms/quilicura-nazareth-venue";
import { sendTransactionalHtmlEmail } from "@/lib/notifications/email";
import { renderTransactionalEmail } from "@/lib/notifications/email-layout";
import type { EmailIdentity } from "@/lib/notifications/identity";
import { resolveEmailIdentityForTenant } from "@/lib/notifications/resolve-identity";

export interface CongressConfirmationEmailInput {
  tenantId: string;
  to: string;
  participantName: string;
  programUrl?: string;
  attachment?: { filename: string; content: Buffer };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderCongressConfirmationEmail(input: {
  identity: EmailIdentity;
  participantName: string;
  programUrl?: string;
  hasAttachment: boolean;
}): { subject: string; html: string; previewText: string } {
  const shownName = displayBrotherName(input.participantName);
  const firstName = shownName.split(/\s+/)[0] || "hermano";
  const subject = "Tu programa del 3° Congreso de Varones";
  const previewText = `${firstName}, el programa del congreso va en este correo.`;
  const when = "Sábado 21 y domingo 22 de noviembre de 2026, desde las 08:00.";
  const place = `${QUILICURA_NAZARETH_VENUE.name}. ${QUILICURA_NAZARETH_VENUE.address}`;
  const attachmentNote = input.hasAttachment
    ? `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;">El programa va <strong>adjunto</strong> a este correo. También puedes descargarlo con el botón.</p>`
    : "";

  const html = renderTransactionalEmail({
    institutionName: input.identity.displayName,
    previewText,
    headline: "Aquí está el programa",
    greeting: `Hola, ${firstName}`,
    bodyHtml: `
      <p style="margin:0 0 8px;">Tu inscripción al 3° Congreso de Varones quedó registrada.</p>
      <p style="margin:14px 0 0;font-size:15px;line-height:1.5;font-weight:700;">${escapeHtml(when)}</p>
      <p style="margin:8px 0 0;">${escapeHtml(place)}</p>
      ${attachmentNote}
    `,
    ctaLabel: input.programUrl ? "Descargar el tríptico" : undefined,
    ctaUrl: input.programUrl,
    footerNote: "Este correo confirma tu inscripción al 3° Congreso de Varones.",
  });

  return { subject, html, previewText };
}

export async function sendCongressConfirmationEmail(
  input: CongressConfirmationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) {
    return { ok: false, error: "Correo del participante no indicado." };
  }

  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const { subject, html } = renderCongressConfirmationEmail({
    identity,
    participantName: input.participantName,
    programUrl: resolvePublicUrl(input.programUrl, identity.origin),
    hasAttachment: Boolean(input.attachment),
  });

  return sendTransactionalHtmlEmail({
    to,
    subject,
    html,
    identity,
    unitIds: [IPN_CHILE_VARONES.unitId],
    attachments: input.attachment ? [input.attachment] : undefined,
  });
}
