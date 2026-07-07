import { jsPDF } from "jspdf";
import { formatClosureDateTime } from "@/lib/student-affairs/closure-datetime";
import { formatGenerationCode, formatGenerationDisplay } from "@/lib/experience/forms/generations";
import type {
  HandoffNominee,
  StudentAffairsFormOperations,
  StudentAffairsHandoffReport,
} from "@/types/student-affairs-operations";

const MARGIN = 16;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE = 5.2;
const INSTITUTION_NAME = "SEMINARIO ECLESIASTICO MAYOR";
const LOGO_PATH = "/images/logo-sem-isotype-line.png";
const LOGO_ASPECT = 827 / 1024;
const HEADER_H = 32;

const BRAND = {
  navy: [30, 42, 71] as [number, number, number],
  blue: [5, 119, 184] as [number, number, number],
  teal: [20, 201, 195] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

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

function stripDarkBackground(imageData: ImageData, threshold = 52): void {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      data[i + 3] = 0;
    }
  }
}

async function loadImageDataUrlFromPng(path: string, renderHeight: number): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight || LOGO_ASPECT;
        const height = renderHeight;
        const width = Math.round(height * aspect);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        context.clearRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        stripDarkBackground(imageData);
        context.putImageData(imageData, 0, 0);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

async function loadSemLogoDataUrl(): Promise<string | null> {
  return loadImageDataUrlFromPng(LOGO_PATH, 180);
}

function groupNomineesByGeneration(
  nominees: HandoffNominee[]
): Array<{ label: string; items: HandoffNominee[] }> {
  const groups = new Map<string, { label: string; items: HandoffNominee[] }>();

  for (const nominee of nominees) {
    const code = formatGenerationCode(nominee.generation);
    const key = code === "—" ? "__sin_generacion__" : code;
    const label =
      code === "—"
        ? "Sin generación asignada"
        : formatGenerationDisplay(nominee.generation) !== "—"
          ? formatGenerationDisplay(nominee.generation)
          : code;

    const existing = groups.get(key);
    if (existing) {
      existing.items.push(nominee);
    } else {
      groups.set(key, { label, items: [nominee] });
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      const order = (key: string) => {
        if (key === "__sin_generacion__") return "z";
        const match = key.match(/^G-(\d{4})$/);
        return match ? match[1] : key;
      };
      return order(a).localeCompare(order(b), "es", { numeric: true });
    })
    .map(([, group]) => ({
      label: group.label,
      items: group.items.sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
    }));
}

function drawPageFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 10;

  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`${INSTITUTION_NAME} · Portal SEM — Asuntos Estudiantiles`, MARGIN, y);
  doc.text(`Página ${pageNumber} de ${totalPages}`, PAGE_W - MARGIN, y, { align: "right" });
}

function createPdfContext(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage();
      y = MARGIN;
    }
  };

  return {
    doc,
    pageHeight,
    get y() {
      return y;
    },
    set y(value: number) {
      y = value;
    },
    ensureSpace,
    advance(delta: number) {
      y += delta;
    },
  };
}

function drawHeader(doc: jsPDF, logoDataUrl: string | null) {
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  doc.setDrawColor(...BRAND.teal);
  doc.setLineWidth(0.8);
  doc.line(0, HEADER_H, PAGE_W, HEADER_H);

  const logoH = 13.5;
  const logoW = logoH * LOGO_ASPECT;
  const logoY = (HEADER_H - logoH) / 2;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", MARGIN, logoY, logoW, logoH, undefined, "FAST");
  }

  const textX = logoDataUrl ? MARGIN + logoW + 5 : MARGIN;
  const textTop = 11.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...BRAND.white);
  doc.text(INSTITUTION_NAME, textX, textTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.teal);
  doc.text("Asuntos Estudiantiles", textX, textTop + 6);
  doc.text("Informe de cierre de jornada presencial", textX, textTop + 11);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 240);
  doc.text("Documento institucional", PAGE_W - MARGIN, HEADER_H / 2 + 1, { align: "right" });
}

function drawTitleBlock(
  ctx: ReturnType<typeof createPdfContext>,
  formName: string,
  formId: string
) {
  const { doc, advance } = ctx;
  ctx.y = HEADER_H + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND.navy);
  doc.text("Informe de cierre — Jornada presencial", MARGIN, ctx.y);
  advance(LINE + 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(20, 20, 20);
  const nameLines = doc.splitTextToSize(formName, CONTENT_W);
  doc.text(nameLines, MARGIN, ctx.y);
  advance(nameLines.length * LINE + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.muted);
  doc.text(`ID formulario: ${formId}`, MARGIN, ctx.y);
  advance(LINE + 4);
}

function drawMetaPanel(
  ctx: ReturnType<typeof createPdfContext>,
  report: StudentAffairsHandoffReport
) {
  const { doc, ensureSpace, advance } = ctx;
  const when = formatClosureDateTime(report.closedAt);
  const panelH = 30;

  ensureSpace(panelH + 4);
  doc.setFillColor(...BRAND.light);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, ctx.y, CONTENT_W, panelH, 2, 2, "FD");

  const colW = CONTENT_W / 2 - 6;
  const leftX = MARGIN + 5;
  const rightX = MARGIN + CONTENT_W / 2 + 1;
  const topY = ctx.y + 7;

  const writeMeta = (x: number, y: number, label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.navy);
    const lines = doc.splitTextToSize(value, colW);
    doc.text(lines, x, y + 4.5);
  };

  writeMeta(leftX, topY, "Cerrado por", report.closedByName);
  writeMeta(rightX, topY, "Fecha de cierre", when.dateLabel);
  writeMeta(leftX, topY + 14, "Hora", when.timeLabel);
  writeMeta(rightX, topY + 14, "Entrega registrada", when.fullLabel);

  advance(panelH + 6);
}

function drawMetricCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent?: [number, number, number]
) {
  doc.setFillColor(...BRAND.white);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

  doc.setFillColor(...(accent ?? BRAND.blue));
  doc.rect(x, y, w, 1.2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.navy);
  doc.text(value, x + 4, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(...BRAND.muted);
  const labelLines = doc.splitTextToSize(label, w - 8);
  doc.text(labelLines, x + 4, y + 13.5);
}

function drawSummaryGrid(ctx: ReturnType<typeof createPdfContext>, report: StudentAffairsHandoffReport) {
  const { doc, ensureSpace, advance } = ctx;
  const arrivalPct =
    report.confirmaron > 0 ? Math.round((report.asistieron / report.confirmaron) * 100) : 0;
  const cardW = (CONTENT_W - 6) / 2;
  const cardH = 20;
  const cardGap = 3;
  const sectionGap = 8;

  const drawCardRow = (rowY: number, left: [string, string, [number, number, number]?], right: [string, string, [number, number, number]?]) => {
    drawMetricCard(doc, MARGIN, rowY, cardW, cardH, left[0], left[1], left[2]);
    drawMetricCard(doc, MARGIN + cardW + 6, rowY, cardW, cardH, right[0], right[1], right[2]);
    return rowY + cardH;
  };

  ensureSpace(cardH * 2 + sectionGap + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.navy);
  doc.text("Resumen de la jornada", MARGIN, ctx.y);
  advance(LINE + 3);

  let gridBottom = drawCardRow(ctx.y, 
    ["Asistieron (confirmados)", `${report.asistieron} / ${report.confirmaron} (${arrivalPct}%)`, BRAND.teal],
    ["Sin asistir (confirmados)", String(report.sinAsistir), [220, 38, 38]]
  ) + cardGap;
  gridBottom = drawCardRow(
    gridBottom,
    ["Respondieron formulario", String(report.respondieron)],
    ["Inasistencias registradas", String(report.inasistencias)]
  );

  ctx.y = gridBottom + sectionGap;

  ensureSpace(cardH * 2 + sectionGap);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.navy);
  doc.text("Traspaso a Asuntos Estudiantiles", MARGIN, ctx.y);
  advance(LINE + 3);

  gridBottom = drawCardRow(
    ctx.y,
    ["Por revisar (excusas)", String(report.porRevisar)],
    ["Sin registrar ni justificar", String(report.sinRegistrarNiJustificar), [220, 38, 38]]
  );

  const extras: Array<{ label: string; value: string }> = [];
  if (report.pendienteContacto > 0) {
    extras.push({ label: "Pendiente contacto", value: String(report.pendienteContacto) });
  }
  if (report.plazoJustificacion > 0) {
    extras.push({ label: "Plazo justificación activo", value: String(report.plazoJustificacion) });
  }

  if (extras.length > 0) {
    gridBottom += cardGap;
    const rowY = gridBottom;
    drawMetricCard(doc, MARGIN, rowY, cardW, cardH, extras[0].label, extras[0].value);
    if (extras[1]) {
      drawMetricCard(doc, MARGIN + cardW + 6, rowY, cardW, cardH, extras[1].label, extras[1].value);
    }
    gridBottom = rowY + cardH;
  }

  ctx.y = gridBottom + sectionGap;
}

function drawSectionTitle(ctx: ReturnType<typeof createPdfContext>, title: string, subtitle?: string) {
  const { doc, ensureSpace, advance } = ctx;

  const titleLines = doc.splitTextToSize(title, CONTENT_W - 8);
  const subtitleLines = subtitle ? doc.splitTextToSize(subtitle, CONTENT_W - 8) : [];
  const blockH = titleLines.length * LINE + (subtitleLines.length ? subtitleLines.length * LINE + 3 : 0) + 4;

  ensureSpace(blockH + 4);

  const barH = Math.max(10, blockH);
  doc.setFillColor(...BRAND.navy);
  doc.rect(MARGIN, ctx.y, 3, barH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BRAND.navy);
  doc.text(titleLines, MARGIN + 6, ctx.y + 4);
  advance(titleLines.length * LINE + 1);

  if (subtitleLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(subtitleLines, MARGIN + 6, ctx.y);
    advance(subtitleLines.length * LINE + 3);
  } else {
    advance(3);
  }
}

function drawGenerationSubgroup(
  ctx: ReturnType<typeof createPdfContext>,
  label: string,
  count: number
) {
  const { doc, ensureSpace, advance } = ctx;
  ensureSpace(10);

  doc.setFillColor(...BRAND.light);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, ctx.y, CONTENT_W, 7.5, 1, 1, "FD");

  doc.setFillColor(...BRAND.teal);
  doc.rect(MARGIN, ctx.y, 2.5, 7.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.navy);
  doc.text(
    `${label} · ${count} participante${count === 1 ? "" : "s"}`,
    MARGIN + 5,
    ctx.y + 5
  );
  advance(9);
}

function drawNominationTable(
  ctx: ReturnType<typeof createPdfContext>,
  nominees: HandoffNominee[],
  options?: { showNote?: boolean; hideGenerationColumn?: boolean }
) {
  const { doc, ensureSpace, advance } = ctx;
  const showNote = options?.showNote ?? false;
  const hideGenerationColumn = options?.hideGenerationColumn ?? false;

  if (!nominees.length) {
    return;
  }

  const cols = showNote
    ? hideGenerationColumn
      ? [
          { label: "N°", w: 8 },
          { label: "Nombre", w: 58 },
          { label: "RUT", w: 28 },
          { label: "Contacto", w: 42 },
          { label: "Observación", w: CONTENT_W - 136 },
        ]
      : [
          { label: "N°", w: 8 },
          { label: "Nombre", w: 48 },
          { label: "RUT", w: 24 },
          { label: "Generación", w: 22 },
          { label: "Contacto", w: 38 },
          { label: "Observación", w: CONTENT_W - 140 },
        ]
    : hideGenerationColumn
      ? [
          { label: "N°", w: 8 },
          { label: "Nombre", w: 68 },
          { label: "RUT", w: 32 },
          { label: "Contacto", w: CONTENT_W - 108 },
        ]
      : [
          { label: "N°", w: 8 },
          { label: "Nombre", w: 58 },
          { label: "RUT", w: 28 },
          { label: "Generación", w: 26 },
          { label: "Contacto", w: CONTENT_W - 120 },
        ];

  const rowH = 7;
  const headerH = 8;

  const drawTableHeader = () => {
    ensureSpace(headerH + rowH);
    let x = MARGIN;
    doc.setFillColor(...BRAND.navy);
    doc.rect(MARGIN, ctx.y, CONTENT_W, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.white);

    for (const col of cols) {
      doc.text(col.label, x + 2, ctx.y + 5.2);
      x += col.w;
    }
    advance(headerH);
  };

  drawTableHeader();

  nominees.forEach((nominee, index) => {
    if (ctx.y + rowH > ctx.pageHeight - 18) {
      doc.addPage();
      ctx.y = MARGIN;
      drawTableHeader();
    }

    const fill = index % 2 === 0 ? BRAND.white : BRAND.light;
    doc.setFillColor(...fill);
    doc.setDrawColor(...BRAND.border);
    doc.rect(MARGIN, ctx.y, CONTENT_W, rowH, "FD");

    const contact = [nominee.email, nominee.phone].filter(Boolean).join(" · ") || "—";
    const values = showNote
      ? hideGenerationColumn
        ? [String(index + 1), nominee.fullName, nominee.rut ?? "—", contact, nominee.note ?? "—"]
        : [
            String(index + 1),
            nominee.fullName,
            nominee.rut ?? "—",
            nominee.generation ?? "—",
            contact,
            nominee.note ?? "—",
          ]
      : hideGenerationColumn
        ? [String(index + 1), nominee.fullName, nominee.rut ?? "—", contact]
        : [
            String(index + 1),
            nominee.fullName,
            nominee.rut ?? "—",
            nominee.generation ?? "—",
            contact,
          ];

    let x = MARGIN;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    cols.forEach((col, colIndex) => {
      const raw = values[colIndex] ?? "—";
      const lines = doc.splitTextToSize(raw, col.w - 3);
      doc.text(lines[0] ?? "—", x + 2, ctx.y + 4.8);
      x += col.w;
    });

    advance(rowH);
  });

  advance(6);
}

function drawNominationTablesByGeneration(
  ctx: ReturnType<typeof createPdfContext>,
  nominees: HandoffNominee[],
  options?: { showNote?: boolean }
) {
  const groups = groupNomineesByGeneration(nominees);

  if (!groups.length) {
    const { doc, ensureSpace, advance } = ctx;
    ensureSpace(12);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text("No hay registros en esta nómina.", MARGIN + 2, ctx.y);
    advance(LINE + 4);
    return;
  }

  for (const group of groups) {
    drawGenerationSubgroup(ctx, group.label, group.items.length);
    drawNominationTable(ctx, group.items, {
      ...options,
      hideGenerationColumn: true,
    });
  }
}

export async function downloadHandoffReportPdf(input: {
  formName: string;
  formId: string;
  report: StudentAffairsHandoffReport;
}): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logoDataUrl = await loadSemLogoDataUrl();
  const ctx = createPdfContext(doc);

  drawHeader(doc, logoDataUrl);
  drawTitleBlock(ctx, input.formName, input.formId);
  drawMetaPanel(ctx, input.report);
  drawSummaryGrid(ctx, input.report);

  const nominations = input.report.nominations;
  const noAttendanceCount = nominations?.noAttendance.length ?? input.report.sinAsistir;
  const unjustifiedCount =
    nominations?.unjustified.length ?? input.report.sinRegistrarNiJustificar;

  drawSectionTitle(
    ctx,
    `Nómina sin asistencia presencial (${noAttendanceCount})`,
    "Participantes que confirmaron asistencia pero no registraron check-in en la jornada."
  );
  drawNominationTablesByGeneration(ctx, nominations?.noAttendance ?? []);

  drawSectionTitle(
    ctx,
    `Nómina sin justificación válida (${unjustifiedCount})`,
    "Inasistencias cerradas sin excusa aceptada o participantes de nómina sin registro en el formulario."
  );
  drawNominationTablesByGeneration(ctx, nominations?.unjustified ?? [], { showNote: true });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawPageFooter(doc, page, totalPages);
  }

  const stamp = input.report.closedAt.slice(0, 10);
  const slug = input.formId.replace(/[^a-z0-9-]+/gi, "-").slice(0, 48);
  doc.save(`${slug}-informe-cierre-${stamp}.pdf`);
}
