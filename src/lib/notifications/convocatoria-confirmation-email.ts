import "server-only";

import {
  formatConvocatoriaDate,
  formatSubmissionPhone,
  publicFormUrl,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import { formatGenerationDisplay } from "@/lib/experience/forms/generations";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  renderCredentialRow,
  renderInfoBox,
  renderTransactionalEmail,
} from "@/lib/notifications/email-layout";
import { sendTransactionalHtmlEmail } from "@/lib/notifications/email";

export interface ConvocatoriaConfirmationEmailInput {
  to: string;
  participantName: string;
  attendance: "yes" | "no";
  convocatoria: FormConvocatoria;
  phone?: string;
  generation?: string;
  professorMessage?: string;
  institutionName?: string;
  /** Si se define, reemplaza el enlace por defecto al formulario público. */
  confirmationEmailCtaUrl?: string;
  /** Si se define, reemplaza la etiqueta por defecto del botón del correo. */
  confirmationEmailCtaLabel?: string;
}

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

function professorAvatarHtml(mood: "happy" | "sad"): string {
  const bg = mood === "happy" ? "#d8f3e4" : "#dbe8f4";
  const accent = mood === "happy" ? "#3ED6AF" : "#246AA1";
  const face = mood === "happy" ? "☺" : "☹";
  const label = mood === "happy" ? "Tu profe está feliz" : "Tu profe te extraña";

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td width="72" valign="top" style="padding-right:14px;">
          <div style="width:64px;height:64px;border-radius:999px;background:${bg};border:2px solid ${accent};text-align:center;line-height:60px;font-size:30px;color:#002A47;">
            ${face}
          </div>
        </td>
        <td valign="middle">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5C7289;">
            ${label}
          </p>
          <p style="margin:0;font-size:12px;color:#5C7289;">Equipo académico — Seminario Eclesiástico Mayor</p>
        </td>
      </tr>
    </table>
  `;
}

function professorQuoteBox(mood: "happy" | "sad", message: string): string {
  const bg = mood === "happy" ? "#ecfbf4" : "#edf4fb";
  const border = mood === "happy" ? "#3ED6AF" : "#246AA1";
  const text = mood === "happy" ? "#0f5132" : "#1e3f5f";

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
  input: ConvocatoriaConfirmationEmailInput
): { subject: string; html: string; previewText: string } {
  const institution = input.institutionName?.trim() || "Seminario Eclesiástico Mayor";
  const isAttending = input.attendance === "yes";
  const mood = isAttending ? "happy" : "sad";
  const eventTitle = input.convocatoria.landing?.headline ?? input.convocatoria.title;
  const eventDate = formatConvocatoriaDate(input.convocatoria.date);
  const eventLocation = input.convocatoria.location;
  const professorMessage =
    input.professorMessage?.trim() ||
    (isAttending ? DEFAULT_YES_MESSAGE : DEFAULT_NO_MESSAGE);
  const formUrl = `${getAppBaseUrl()}${publicFormUrl(input.convocatoria.formId)}`;
  const ctaUrl = input.confirmationEmailCtaUrl?.trim() || formUrl;
  const defaultCtaLabel = isAttending ? "Ver detalles de la convocatoria" : "Revisar convocatoria";
  const ctaLabel = input.confirmationEmailCtaLabel?.trim() || defaultCtaLabel;
  const firstName = input.participantName.trim().split(/\s+/)[0] || input.participantName;

  const headline = isAttending
    ? "¡Tu asistencia quedó confirmada!"
    : "Recibimos tu respuesta";

  const previewText = isAttending
    ? `¡Nos vemos en Talca Aurora, ${firstName}! Tu asistencia fue registrada.`
    : `${firstName}, gracias por avisarnos. El equipo académico revisará tu respuesta.`;

  const intro = isAttending
    ? `<p style="margin:0 0 16px;">Registramos correctamente tu confirmación para la jornada presencial. Guarda este correo como comprobante.</p>`
    : `<p style="margin:0 0 16px;">Registramos que no podrás asistir a la jornada. Si enviaste una justificación, el equipo académico la revisará según la política institucional.</p>`;

  const summaryHtml = renderInfoBox(`
    ${renderCredentialRow("Participante", input.participantName)}
    ${renderCredentialRow("Respuesta", isAttending ? "Sí, asistiré" : "No podré asistir")}
    ${input.generation ? renderCredentialRow("Programa", formatGenerationDisplay(input.generation)) : ""}
    ${input.phone ? renderCredentialRow("Teléfono", formatSubmissionPhone(input.phone)) : ""}
    ${renderCredentialRow("Fecha", eventDate)}
    ${renderCredentialRow("Lugar", eventLocation)}
    <p style="margin:14px 0 0;">${attendanceBadge(input.attendance)}</p>
  `);

  const bodyHtml = `
    ${intro}
    <div style="margin:22px 0;padding:20px;border-radius:16px;background:#F5F7F9;border:1px solid #D1D9E0;">
      ${professorAvatarHtml(mood)}
      ${professorQuoteBox(mood, professorMessage)}
    </div>
    <h2 style="margin:24px 0 10px;font-size:15px;color:#141F29;">Resumen de tu respuesta</h2>
    ${summaryHtml}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#5C7289;">
      ${isAttending
        ? "Te esperamos puntualmente desde las 9:00 a.m. Recuerda que la jornada incluye evaluación académica."
        : "Si tu situación cambia, contacta a asuntos estudiantiles. Estamos para acompañarte en tu proceso formativo."}
    </p>
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText,
    headline,
    greeting: `Hola, ${firstName}`,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote: "Este correo confirma el registro de tu respuesta en el portal institucional.",
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

  const { subject, html } = renderConvocatoriaConfirmationEmail(input);
  return sendTransactionalHtmlEmail({ to, subject, html });
}
