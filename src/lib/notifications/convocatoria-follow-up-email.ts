import "server-only";

import {
  absenceReviewStatusLabel,
  formatConvocatoriaDate,
  getConvocatoriaByFormId,
  type FormConvocatoria,
} from "@/lib/admin/forms-center";
import { buildParticipantJustifyUrl } from "@/lib/experience/forms/submission-participant-token";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  renderCredentialRow,
  renderInfoBox,
  renderSteps,
  renderTransactionalEmail,
} from "@/lib/notifications/email-layout";
import { sendTransactionalHtmlEmail } from "@/lib/notifications/email";
import type { AbsenceReviewStatus } from "@/types/experience-forms";

interface ParticipantEmailBase {
  to: string;
  participantName: string;
  convocatoria: FormConvocatoria;
  institutionName?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function eventSummary(convocatoria: FormConvocatoria): string {
  return renderInfoBox(`
    ${renderCredentialRow("Jornada", convocatoria.landing?.headline ?? convocatoria.title)}
    ${renderCredentialRow("Fecha", formatConvocatoriaDate(convocatoria.date))}
    ${renderCredentialRow("Lugar", convocatoria.location)}
  `);
}

const JORNADA_WELCOME_VERSE = {
  text: "Como el hierro se afila con hierro, así el hombre se afila con su prójimo.",
  reference: "Proverbios 27:17",
};

function renderScriptureQuote(verse: string, reference: string): string {
  return `
    <div style="margin:22px 0;padding:20px 22px;border-radius:14px;background:#ecfbf4;border-left:4px solid #3ED6AF;text-align:center;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f5132;">
        Palabra para el camino
      </p>
      <p style="margin:0 0 10px;font-size:17px;line-height:1.65;font-style:italic;font-weight:600;color:#141F29;">
        «${escapeHtml(verse)}»
      </p>
      <p style="margin:0;font-size:13px;font-weight:600;color:#3ED6AF;">
        ${escapeHtml(reference)}
      </p>
    </div>
  `;
}

function renderJornadaWelcomeBody(
  convocatoria: FormConvocatoria,
  options?: { arrivedFromAbsenceNote?: boolean }
): string {
  const arrivedNote = options?.arrivedFromAbsenceNote
    ? `<p style="margin:0 0 16px;">
        Si antes habías indicado que no asistirías, actualizamos tu estado para reflejar tu presencia el día del evento.
      </p>`
    : "";

  return `
    <p style="margin:0 0 16px;">
      Acabamos de registrar tu <strong>llegada</strong> a la jornada presencial.
      <strong>¡Qué alegría recibirte entre nosotros!</strong>
    </p>
    ${arrivedNote}
    <p style="margin:0 0 16px;">
      Hoy vivimos una jornada de <strong>evaluación académica</strong> y de
      <strong>compañerismo fraterno</strong>: un espacio para rendir cuenta de tu proceso formativo,
      fortalecer lazos con docentes y compañeros, y celebrar juntos la vocación al servicio de la Iglesia.
    </p>
    ${renderScriptureQuote(JORNADA_WELCOME_VERSE.text, JORNADA_WELCOME_VERSE.reference)}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#5C7289;">
      Te deseamos una jornada edificante. El equipo de asuntos estudiantiles y el cuerpo docente
      están atentos para acompañarte en cada momento.
    </p>
    <h2 style="margin:24px 0 10px;font-size:15px;color:#141F29;">Detalle de la jornada</h2>
    ${eventSummary(convocatoria)}
  `;
}

function renderJornadaWelcomeEmail(input: ParticipantEmailBase & { arrivedFromAbsenceNote?: boolean }) {
  const name = firstName(input.participantName);
  const institution = input.institutionName?.trim() || "Seminario Eclesiástico Mayor";
  const eventTitle = input.convocatoria.landing?.headline ?? input.convocatoria.title;

  return {
    name,
    institution,
    html: renderTransactionalEmail({
      institutionName: institution,
      previewText: `${name}, ¡bienvenido/a a la jornada! Registramos tu llegada con alegría.`,
      headline: "¡Bienvenido/a a la jornada!",
      greeting: `Hola, ${name}`,
      bodyHtml: renderJornadaWelcomeBody(input.convocatoria, {
        arrivedFromAbsenceNote: input.arrivedFromAbsenceNote,
      }),
      ctaLabel: "Ver convocatoria",
      ctaUrl: `${getAppBaseUrl()}/formularios/${encodeURIComponent(input.convocatoria.formId)}`,
      footerNote:
        "Conserva este correo como comprobante de tu asistencia presencial. Registro realizado por el equipo de asuntos estudiantiles.",
    }),
    subject: `¡Bienvenido/a a la jornada! — ${eventTitle}`,
  };
}

export async function sendParticipantNoShowJustifyEmail(
  input: ParticipantEmailBase & { submissionId: string; operatorNotes?: string }
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Correo del participante no indicado." };

  const name = firstName(input.participantName);
  const justifyUrl = buildParticipantJustifyUrl(input.submissionId);
  const institution = input.institutionName?.trim() || "Seminario Eclesiástico Mayor";

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      En el registro de la jornada presencial anotamos que <strong>no llegaste</strong> pese a haber confirmado asistencia.
    </p>
    <p style="margin:0 0 16px;">
      Si tu inasistencia se debe a una situación de fuerza mayor, debes <strong>justificarla por escrito</strong> y
      <strong>adjuntar un respaldo documental</strong> (certificado médico, carta u otro documento verificable).
    </p>
    ${input.operatorNotes?.trim()
      ? `<p style="margin:0 0 16px;padding:14px 16px;border-radius:12px;background:#edf4fb;border-left:4px solid #246AA1;color:#1e3f5f;">
          <strong>Nota del equipo:</strong> ${escapeHtml(input.operatorNotes.trim())}
        </p>`
      : ""}
    ${renderSteps([
      "Abre el enlace seguro de abajo.",
      "Describe brevemente el motivo de tu inasistencia.",
      "Adjunta el respaldo en PDF o imagen.",
      "El equipo académico revisará tu caso y te informará por correo.",
    ])}
    <h2 style="margin:24px 0 10px;font-size:15px;color:#141F29;">Detalle de la jornada</h2>
    ${eventSummary(input.convocatoria)}
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText: `${name}, completa la justificación de tu inasistencia a la jornada.`,
    headline: "Justifica tu inasistencia",
    greeting: `Hola, ${name}`,
    bodyHtml,
    ctaLabel: "Completar justificación",
    ctaUrl: justifyUrl,
    footerNote: "Este enlace es personal e intransferible. Si ya enviaste tu justificativo, ignora este mensaje.",
  });

  return sendTransactionalHtmlEmail({
    to,
    subject: `Justifica tu inasistencia — ${input.convocatoria.title}`,
    html,
  });
}

export async function sendParticipantArrivedEmail(
  input: ParticipantEmailBase
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Correo del participante no indicado." };

  const { html, subject } = renderJornadaWelcomeEmail({
    ...input,
    arrivedFromAbsenceNote: true,
  });

  return sendTransactionalHtmlEmail({
    to,
    subject,
    html,
  });
}

export async function sendParticipantCheckInEmail(
  input: ParticipantEmailBase
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Correo del participante no indicado." };

  const { html, subject } = renderJornadaWelcomeEmail(input);

  return sendTransactionalHtmlEmail({
    to,
    subject,
    html,
  });
}

export async function sendParticipantAbsenceReviewEmail(input: {
  to: string;
  participantName: string;
  formId: string;
  status: AbsenceReviewStatus;
  managementNotes?: string;
  evidenceReceived?: boolean;
  evidenceNotes?: string;
  institutionName?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Correo del participante no indicado." };

  const convocatoria = getConvocatoriaByFormId(input.formId);
  const institution = input.institutionName?.trim() || "Seminario Eclesiástico Mayor";
  const name = firstName(input.participantName);
  const statusLabel = absenceReviewStatusLabel(input.status);

  const statusMessage =
    input.status === "approved"
      ? "Tu inasistencia fue revisada y <strong>aceptada como fuerza mayor</strong>."
      : input.status === "rejected"
        ? "Tras revisar tu caso, la inasistencia <strong>no procede</strong> según la política institucional."
        : "Tu justificación está <strong>pendiente de revisión</strong> por el equipo académico.";

  const bodyHtml = `
    <p style="margin:0 0 16px;">${statusMessage}</p>
    ${renderInfoBox(`
      ${renderCredentialRow("Estado", statusLabel)}
      ${input.evidenceReceived ? renderCredentialRow("Respaldo recibido", "Sí") : ""}
      ${input.evidenceNotes?.trim() ? renderCredentialRow("Detalle del respaldo", input.evidenceNotes.trim()) : ""}
    `)}
    ${input.managementNotes?.trim()
      ? `<p style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:#F5F7F9;border:1px solid #D1D9E0;color:#141F29;">
          <strong>Gestión del equipo:</strong><br/>
          ${escapeHtml(input.managementNotes.trim()).replace(/\n/g, "<br/>")}
        </p>`
      : ""}
    ${convocatoria
      ? `<h2 style="margin:24px 0 10px;font-size:15px;color:#141F29;">Jornada</h2>${eventSummary(convocatoria)}`
      : ""}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.7;color:#5C7289;">
      Si tienes dudas, responde a este correo o contacta a asuntos estudiantiles.
    </p>
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText: `${name}, actualización sobre tu inasistencia: ${statusLabel}.`,
    headline: "Actualización de tu inasistencia",
    greeting: `Hola, ${name}`,
    bodyHtml,
    footerNote: "Este mensaje resume la gestión realizada por el equipo académico.",
  });

  return sendTransactionalHtmlEmail({
    to,
    subject: `Actualización de inasistencia — ${statusLabel}`,
    html,
  });
}
