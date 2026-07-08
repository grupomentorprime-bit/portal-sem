import "server-only";

import { getAppBaseUrl } from "@/lib/app-url";
import {
  renderInfoBox,
  renderTransactionalEmail,
} from "@/lib/notifications/email-layout";
import { sendTransactionalHtmlEmail } from "@/lib/notifications/email";
import type { HandoffNominee } from "@/types/student-affairs-operations";

const BRAND_TEXT = "#141F29";
const BRAND_MUTED = "#5C7289";
const BRAND_BORDER = "#D1D9E0";

export interface HandoffGenerationGroup {
  code: string;
  label: string;
  /** Sin excusa: hay que solicitar la justificación. */
  toRequest: HandoffNominee[];
  /** Excusa presentada: hay que revisar (validar o rechazar). */
  toReview: HandoffNominee[];
  /** Confirmaron asistencia pero no registraron check-in presencial. */
  noShow: HandoffNominee[];
}

export interface HandoffValidationEmailInput {
  to: string;
  encargadaName: string;
  formName: string;
  eventDateLabel?: string;
  eventLocation?: string;
  validatedByName: string;
  groups: HandoffGenerationGroup[];
  panelUrl: string;
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

function nomineeContact(nominee: HandoffNominee): string {
  return [nominee.email, nominee.phone].filter(Boolean).join(" · ");
}

function renderNomineeList(nominees: HandoffNominee[]): string {
  const rows = nominees
    .map((nominee) => {
      const contact = nomineeContact(nominee);
      const rut = nominee.rut ? ` · ${escapeHtml(nominee.rut)}` : "";
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid ${BRAND_BORDER};font-size:13px;color:${BRAND_TEXT};">
            <strong>${escapeHtml(nominee.fullName)}</strong>${rut}
            ${contact ? `<br/><span style="font-size:12px;color:${BRAND_MUTED};">${escapeHtml(contact)}</span>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 0;border:1px solid ${BRAND_BORDER};border-radius:10px;overflow:hidden;">${rows}</table>`;
}

function renderSubSection(
  title: string,
  accent: string,
  description: string,
  nominees: HandoffNominee[]
): string {
  if (!nominees.length) return "";
  return `
    <div style="margin:16px 0 0;">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${accent};">
        ${escapeHtml(title)} (${nominees.length})
      </p>
      <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${BRAND_MUTED};">
        ${escapeHtml(description)}
      </p>
      ${renderNomineeList(nominees)}
    </div>`;
}

function renderGroup(group: HandoffGenerationGroup): string {
  const total = group.toRequest.length + group.toReview.length + group.noShow.length;
  if (total === 0) return "";

  return `
    <div style="margin:22px 0 0;padding:18px 18px 6px;border:1px solid ${BRAND_BORDER};border-radius:14px;">
      <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:${BRAND_TEXT};">
        ${escapeHtml(group.label)}
      </p>
      <p style="margin:0;font-size:12px;color:${BRAND_MUTED};">
        ${total} registro${total === 1 ? "" : "s"} para gestión
      </p>
      ${renderSubSection(
        "Solicitar justificación",
        "#B4232A",
        "Aún no presentan excusa. Contáctalos y solicita el respaldo de su inasistencia.",
        group.toRequest
      )}
      ${renderSubSection(
        "Revisar excusa presentada",
        "#B45309",
        "Presentaron justificación. Revísala para validar o rechazar según la política institucional.",
        group.toReview
      )}
      ${renderSubSection(
        "Verificar sin check-in",
        "#246AA1",
        "Confirmaron asistencia pero no registraron ingreso el día de la jornada.",
        group.noShow
      )}
    </div>`;
}

export async function sendHandoffValidationEmail(
  input: HandoffValidationEmailInput
): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Correo de la encargada no indicado." };

  const activeGroups = input.groups.filter(
    (group) => group.toRequest.length + group.toReview.length + group.noShow.length > 0
  );
  if (activeGroups.length === 0) {
    return { ok: false, error: "Sin registros pendientes para esta encargada." };
  }

  const institution = input.institutionName?.trim() || "Seminario Eclesiástico Mayor";
  const name = firstName(input.encargadaName);
  const totalRequest = activeGroups.reduce((sum, g) => sum + g.toRequest.length, 0);
  const totalReview = activeGroups.reduce((sum, g) => sum + g.toReview.length, 0);

  const eventMeta = renderInfoBox(`
    <p style="margin:0 0 6px;font-size:13px;color:${BRAND_TEXT};"><strong>Jornada:</strong> ${escapeHtml(input.formName)}</p>
    ${input.eventDateLabel ? `<p style="margin:0 0 6px;font-size:13px;color:${BRAND_TEXT};"><strong>Fecha:</strong> ${escapeHtml(input.eventDateLabel)}</p>` : ""}
    ${input.eventLocation ? `<p style="margin:0 0 6px;font-size:13px;color:${BRAND_TEXT};"><strong>Lugar:</strong> ${escapeHtml(input.eventLocation)}</p>` : ""}
    <p style="margin:0;font-size:13px;color:${BRAND_TEXT};"><strong>Informe validado por:</strong> ${escapeHtml(input.validatedByName)}</p>
  `);

  const bodyHtml = `
    <p style="margin:0 0 16px;">
      El informe de cierre de la jornada fue <strong>validado</strong> y ya puedes iniciar el
      seguimiento de las inasistencias de <strong>tus generaciones asignadas</strong>.
    </p>
    ${eventMeta}
    <p style="margin:18px 0 0;font-size:14px;color:${BRAND_TEXT};">
      Tienes <strong>${totalRequest}</strong> ${totalRequest === 1 ? "persona a la que solicitar justificación" : "personas a las que solicitar justificación"}
      y <strong>${totalReview}</strong> ${totalReview === 1 ? "excusa por revisar" : "excusas por revisar"}.
    </p>
    ${activeGroups.map(renderGroup).join("")}
  `;

  const html = renderTransactionalEmail({
    institutionName: institution,
    previewText: `${name}, ya puedes gestionar las inasistencias de tus generaciones: ${totalRequest} por contactar, ${totalReview} por revisar.`,
    headline: "Seguimiento de inasistencias habilitado",
    greeting: `Hola, ${name}`,
    bodyHtml,
    ctaLabel: "Ir a la gestión de la jornada",
    ctaUrl: input.panelUrl,
    footerNote:
      "Gestiona cada caso desde la plataforma: solicita las excusas pendientes y valida o rechaza las presentadas. Este correo fue generado automáticamente por Asuntos Estudiantiles.",
  });

  return sendTransactionalHtmlEmail({
    to,
    subject: `Seguimiento de inasistencias — ${input.formName}`,
    html,
  });
}

export function buildStudentAffairsPanelUrl(formId: string): string {
  return `${getAppBaseUrl()}/admin/portal/asuntos-estudiantiles/${encodeURIComponent(formId)}`;
}
