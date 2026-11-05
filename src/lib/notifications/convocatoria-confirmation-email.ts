import "server-only";

import {
  formatConvocatoriaDate,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import { resolvePublicUrl } from "@/lib/app-url";
import { renderTransactionalEmail } from "@/lib/notifications/email-layout";
import { sendTransactionalHtmlEmail } from "@/lib/notifications/email";
import {
  emailAbsoluteUrl,
  type EmailIdentity,
} from "@/lib/notifications/identity";
import { resolveEmailIdentityForTenant } from "@/lib/notifications/resolve-identity";
import {
  isTalcaAuroraLocation,
  TALCA_AURORA_VENUE,
} from "@/lib/experience/forms/talca-aurora-venue";

export interface ConvocatoriaConfirmationEmailInput {
  tenantId: string;
  to: string;
  participantName: string;
  attendance: "yes" | "no";
  convocatoria: FormConvocatoria;
  phone?: string;
  generation?: string;
  professorMessage?: string;
  /** Si se define, reemplaza el enlace por defecto al formulario público. */
  confirmationEmailCtaUrl?: string;
  /** Si se define, reemplaza la etiqueta por defecto del botón del correo. */
  confirmationEmailCtaLabel?: string;
  /** PDF u otro documento adjunto al correo (p. ej. programa de la jornada). */
  confirmationEmailAttachment?: { filename: string; content: Buffer };
  /** Fecha y horario tal como se ven en el formulario. */
  eventWhen?: string;
}

type ConfirmationRenderInput = Omit<
  ConvocatoriaConfirmationEmailInput,
  "tenantId" | "to"
> & { identity: EmailIdentity };

const DEFAULT_YES_MESSAGE =
  "¡Qué alegría! Nos encantará verte en la jornada. ¡Contentos por vernos!";
const DEFAULT_NO_MESSAGE =
  "¡Qué lástima! Te extrañaremos en la jornada. Gracias por avisarnos.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function directionButton(href: string, label: string, background: string, color: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" bgcolor="${background}" style="border-radius:10px;">
          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
            style="display:block;padding:13px 10px;font-size:14px;font-weight:700;line-height:1.2;color:${color};text-decoration:none;border-radius:10px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function directionsCardHtml(): string {
  const venue = TALCA_AURORA_VENUE;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:18px 0 0;border-collapse:separate;">
      <tr>
        <td style="border-radius:16px;overflow:hidden;border:1px solid #E4DFF2;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td bgcolor="#1E1B4B" style="padding:18px 20px 16px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#22D3EE;">
                  Cómo llegar
                </p>
                <p style="margin:0;font-size:20px;line-height:1.25;font-weight:700;color:#ffffff;">
                  ${escapeHtml(venue.name)}
                </p>
                <p style="margin:6px 0 0;font-size:13px;line-height:1.4;color:#D4CCEA;">
                  ${escapeHtml(venue.place)}
                </p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#F7F5FF" style="padding:16px 16px 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" valign="top" style="padding-right:6px;">
                      ${directionButton(venue.googleDirectionsUrl, "Google Maps", "#1A73E8", "#ffffff")}
                    </td>
                    <td width="50%" valign="top" style="padding-left:6px;">
                      ${directionButton(venue.wazeUrl, "Waze", "#33CCFF", "#002A47")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function professorQuoteBox(mood: "happy" | "sad", message: string): string {
  const bg = mood === "happy" ? "#ECFDF5" : "#EFEAFC";
  const border = mood === "happy" ? "#18B981" : "#6D28D9";
  const text = mood === "happy" ? "#065F46" : "#1E1B4B";

  return `
    <div style="margin:20px 0 0;padding:18px 20px;border-radius:14px;background:${bg};border-left:4px solid ${border};">
      <p style="margin:0;font-size:17px;line-height:1.65;font-weight:600;color:${text};">
        “${escapeHtml(message)}”
      </p>
    </div>
  `;
}

function attendanceBadge(attendance: "yes" | "no"): string {
  if (attendance === "yes") {
    return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfbf4;color:#0f5132;font-size:12px;font-weight:700;">✓ Asistirás</span>`;
  }
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#edf4fb;color:#1e3f5f;font-size:12px;font-weight:700;">No podrás asistir</span>`;
}

export function renderConvocatoriaConfirmationEmail(
  input: ConfirmationRenderInput
): { subject: string; html: string; previewText: string } {
  const institution = input.identity.displayName;
  const isAttending = input.attendance === "yes";
  const mood = isAttending ? "happy" : "sad";
  const eventTitle = input.convocatoria.landing?.headline ?? input.convocatoria.title;
  const eventDate = formatConvocatoriaDate(input.convocatoria.date);
  const eventWhen = input.eventWhen?.trim() || eventDate;
  const eventLocation = input.convocatoria.location;
  const showDirections = isAttending && isTalcaAuroraLocation(eventLocation);
  const professorMessage =
    input.professorMessage?.trim() ||
    (isAttending ? DEFAULT_YES_MESSAGE : DEFAULT_NO_MESSAGE);
  const formUrl = emailAbsoluteUrl(
    input.identity,
    publicFormUrl(input.convocatoria.formId)
  );
  const customCtaUrl = resolvePublicUrl(input.confirmationEmailCtaUrl, input.identity.origin);
  const ctaUrl = showDirections ? customCtaUrl : customCtaUrl || formUrl;
  const defaultCtaLabel = isAttending ? "Ver el programa" : "Revisar convocatoria";
  const ctaLabel = ctaUrl ? input.confirmationEmailCtaLabel?.trim() || defaultCtaLabel : undefined;
  const firstName = input.participantName.trim().split(/\s+/)[0] || input.participantName;

  const headline = isAttending
    ? "¡Tu asistencia quedó confirmada!"
    : "Recibimos tu respuesta";

  const previewText = isAttending
    ? showDirections
      ? `${firstName}, te esperamos en el ${TALCA_AURORA_VENUE.name}. Abre la ruta en Google Maps o Waze.`
      : `${firstName}, tu asistencia quedó registrada.`
    : `${firstName}, gracias por avisarnos. El equipo académico revisará tu respuesta.`;

  const intro = isAttending
    ? `<p style="margin:0 0 8px;">Tu lugar quedó reservado. Te esperamos.</p>`
    : `<p style="margin:0 0 8px;">Registramos que no podrás asistir. Si enviaste una justificación, el equipo académico la revisará.</p>`;

  const whenHtml = `
    <p style="margin:14px 0 0;font-size:15px;line-height:1.45;font-weight:700;color:#1E1B4B;">
      ${escapeHtml(eventWhen)}
    </p>
    <p style="margin:4px 0 0;">${attendanceBadge(input.attendance)}</p>
  `;

  const bodyHtml = `
    ${intro}
    ${whenHtml}
    ${showDirections ? directionsCardHtml() : ""}
    ${professorQuoteBox(mood, professorMessage)}
    ${input.confirmationEmailAttachment
      ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#5C7289;">El programa va <strong>adjunto</strong> a este correo.</p>`
      : ""}
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText,
    headline,
    greeting: `Hola, ${firstName}`,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote: "Este correo confirma el registro de tu respuesta.",
  });

  const subject = isAttending
    ? `¡Confirmamos tu asistencia! — ${eventTitle}`
    : `Recibimos tu respuesta — ${eventTitle}`;

  return { subject, html, previewText };
}

export async function sendConvocatoriaConfirmationEmail(
  input: ConvocatoriaConfirmationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) {
    return { ok: false, error: "Correo del participante no indicado." };
  }

  const identity = await resolveEmailIdentityForTenant(input.tenantId);
  const { subject, html } = renderConvocatoriaConfirmationEmail({
    ...input,
    identity,
  });
  return sendTransactionalHtmlEmail({
    to,
    subject,
    html,
    identity,
    attachments: input.confirmationEmailAttachment
      ? [input.confirmationEmailAttachment]
      : undefined,
  });
}
