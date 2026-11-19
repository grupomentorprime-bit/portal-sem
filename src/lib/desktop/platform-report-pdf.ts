import { jsPDF } from "jspdf";
import { intakeChannelLabel, type ReportDispatchRecord } from "@/lib/desktop/platform-desk";

export interface IncidentReportPdfInput {
  company: string;
  periodLabel: string;
  channelLabel: string;
  totals: { received: number; open: number; resolved: number };
  rows: Array<{ code: string; subject: string; requester: string; channel: string; status: string }>;
  emittedAt: string;
}

export function incidentReportLines(input: IncidentReportPdfInput): string[] {
  return [
    "Informe de incidencias",
    input.company,
    input.periodLabel,
    input.channelLabel || "Todos los canales",
    `Recibidas: ${input.totals.received}`,
    `Abiertas: ${input.totals.open}`,
    `Resueltas: ${input.totals.resolved}`,
    ...input.rows.map((row) => `${row.code} · ${row.subject} · ${row.requester} · ${row.channel} · ${row.status}`),
    input.emittedAt,
  ];
}

export function buildIncidentReportPdf(input: IncidentReportPdfInput): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const lines = incidentReportLines(input);
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(lines[0] ?? "Informe de incidencias", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const line of lines.slice(1)) {
    const wrapped = doc.splitTextToSize(line, 180) as string[];
    for (const part of wrapped) {
      if (y > 280) {
        doc.addPage();
        y = 18;
      }
      doc.text(part, 14, y);
      y += 6;
    }
  }
  return new Uint8Array(doc.output("arraybuffer"));
}

export function reportMailSubject(company: string, periodLabel: string): string {
  return `Informe de incidencias · ${company} · ${periodLabel}`;
}

export function reportFileName(company: string): string {
  const slug = company
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `informe-incidencias-${slug || "empresa"}.pdf`;
}

export function dispatchSummary(record: Pick<ReportDispatchRecord, "result" | "to" | "cc" | "at">): string {
  const to = record.to.map((person) => person.name).join(", ") || "sin destinatario";
  const cc = record.cc.length > 0 ? ` Copia: ${record.cc.map((person) => person.name).join(", ")}.` : "";
  const outcome = record.result === "enviado" ? "Enviado" : "No enviado";
  return `${outcome} a ${to}.${cc}`;
}

export function channelFilterLabel(channel: string): string {
  return channel ? intakeChannelLabel(channel) : "Todos los canales";
}
