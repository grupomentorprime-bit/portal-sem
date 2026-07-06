import { jsPDF } from "jspdf";
import { formatClosureDateTime } from "@/lib/student-affairs/closure-datetime";
import type {
  StudentAffairsFormOperations,
  StudentAffairsHandoffReport,
} from "@/types/student-affairs-operations";

const MARGIN = 18;
const LINE = 6.5;

export function resolveHandoffReportForDownload(
  operations: StudentAffairsFormOperations | null,
  reportOverride?: StudentAffairsHandoffReport | null
): StudentAffairsHandoffReport | null {
  const report = reportOverride ?? operations?.handoffReport;
  if (!report) return null;

  const closedByName =
    report.closedByName?.trim() || operations?.onSiteClosedByName?.trim() || "Operador";
  const closedAt = report.closedAt || operations?.onSiteClosedAt || report.generatedAt;

  return {
    ...report,
    closedByName,
    closedAt,
    closedByUserId: report.closedByUserId ?? operations?.onSiteClosedByUserId,
  };
}

export function downloadHandoffReportPdf(input: {
  formName: string;
  formId: string;
  report: StudentAffairsHandoffReport;
}): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = doc.internal.pageSize.getWidth() - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeSection = (title: string) => {
    ensureSpace(LINE * 2);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 42, 71);
    doc.text(title, MARGIN, y);
    y += LINE + 1;
  };

  const writeRow = (label: string, value: string) => {
    ensureSpace(LINE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    const valueX = MARGIN + 62;
    const lines = doc.splitTextToSize(value, contentWidth - 62);
    doc.text(lines, valueX, y);
    y += Math.max(LINE, lines.length * LINE - 1);
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 42, 71);
  doc.text("Informe de cierre — Jornada presencial", MARGIN, y);
  y += LINE + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  const nameLines = doc.splitTextToSize(input.formName, contentWidth);
  doc.text(nameLines, MARGIN, y);
  y += nameLines.length * LINE;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`ID formulario: ${input.formId}`, MARGIN, y);
  y += LINE + 2;

  const when = formatClosureDateTime(input.report.closedAt);
  writeSection("Registro de cierre e informe");
  writeRow("Cerrado por", input.report.closedByName);
  writeRow("Informe gestionado por", input.report.closedByName);
  writeRow("Fecha", when.dateLabel);
  writeRow("Hora", when.timeLabel);
  writeRow("Entrega registrada", when.fullLabel);

  const report = input.report;
  const arrivalPct =
    report.confirmaron > 0 ? Math.round((report.asistieron / report.confirmaron) * 100) : 0;

  writeSection("Resumen presencial");
  writeRow(
    "Asistieron",
    `${report.asistieron} / ${report.confirmaron} confirmados (${arrivalPct}%)`
  );
  writeRow("Sin asistir (confirmados)", String(report.sinAsistir));
  writeRow("Respondieron formulario", String(report.respondieron));
  writeRow("Confirmaron asistencia", String(report.confirmaron));
  writeRow("Inasistencias registradas", String(report.inasistencias));

  writeSection("Traspaso a Asuntos Estudiantiles");
  writeRow("Por revisar (excusas)", String(report.porRevisar));
  writeRow("Sin registrar ni justificar", String(report.sinRegistrarNiJustificar));
  if (report.pendienteContacto > 0) {
    writeRow("Pendiente contacto", String(report.pendienteContacto));
  }
  if (report.plazoJustificacion > 0) {
    writeRow("Plazo justificacion", String(report.plazoJustificacion));
  }

  ensureSpace(LINE * 3);
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Documento generado automaticamente por Portal SEM — Asuntos Estudiantiles.",
    MARGIN,
    y
  );

  const stamp = report.closedAt.slice(0, 10);
  const slug = input.formId.replace(/[^a-z0-9-]+/gi, "-").slice(0, 48);
  doc.save(`${slug}-informe-cierre-${stamp}.pdf`);
}
