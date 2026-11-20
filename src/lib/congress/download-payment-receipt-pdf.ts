"use client";

import { jsPDF } from "jspdf";
import { VENDOR_CREDIT_LABEL } from "@/core/branding/display";
import { normalizePaymentMethod, type CashMethodKey } from "@/core/congress/cash-box";
import {
  CONGRESS_TREASURER_NAME,
  CONGRESS_TREASURER_OFFICE,
  CONGRESS_TREASURER_ROLE,
} from "@/core/congress/constants";
import { paymentReceiptFilename } from "@/core/congress/payment-folio";
import type { CongressPayment } from "@/core/congress/types";

const LOGO_PATH = "/branding/ipn-chile/varones-nacional.png";
const MARGIN = 16;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 279;

const METHOD_LABELS: Record<CashMethodKey, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
  unclassified: "Sin medio",
};

async function loadLogoDataUrl(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.trunc(value));
}

function formatPaidOn(payment: CongressPayment): string {
  if (payment.paidOn) return payment.paidOn;
  return payment.createdAt.slice(0, 10);
}

function formatEmittedAt(): string {
  return new Date().toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function methodLabel(payment: CongressPayment): string {
  return METHOD_LABELS[normalizePaymentMethod(payment.method)];
}

function addFooter(doc: jsPDF, emittedAt: string): void {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, FOOTER_Y - 5, PAGE_WIDTH - MARGIN, FOOTER_Y - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Comprobante operativo de recaudacion del Departamento de Varones (no es boleta ni factura SII).",
    MARGIN,
    FOOTER_Y,
    { maxWidth: CONTENT_WIDTH }
  );
  doc.text(`Emitido America/Santiago: ${emittedAt}`, MARGIN, FOOTER_Y + 6);
  doc.text(`${VENDOR_CREDIT_LABEL} · mentorprime.cl`, MARGIN, FOOTER_Y + 11);
  doc.setTextColor(0);
}

function ensureBodySpace(doc: jsPDF, y: number, needed = 8): number {
  if (y + needed <= FOOTER_Y - 8) return y;
  doc.addPage();
  return MARGIN;
}

function addLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  y: number
): number {
  const textX = MARGIN + 46;
  const lines = doc.splitTextToSize(value, PAGE_WIDTH - textX - MARGIN);

  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(lines, textX, y);

  return y + Math.max(7, lines.length * 5.5);
}

function addVoidedStamp(doc: jsPDF, y: number): number {
  doc.setTextColor(180, 0, 0);
  doc.setDrawColor(180, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.rect(75, y - 8, 60, 14);
  doc.text("ANULADO", PAGE_WIDTH / 2, y + 2, { align: "center" });
  doc.setTextColor(0);
  doc.setDrawColor(0);
  return y + 16;
}

function addSignature(doc: jsPDF, y: number): void {
  const block = 36;
  y = ensureBodySpace(doc, y + 8, block);
  const lineWidth = 72;
  const lineX = PAGE_WIDTH - MARGIN - lineWidth;
  const centerX = lineX + lineWidth / 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Firma", centerX, y, { align: "center" });
  y += 16;
  doc.setDrawColor(40);
  doc.setLineWidth(0.35);
  doc.line(lineX, y, lineX + lineWidth, y);
  y += 5;
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(CONGRESS_TREASURER_NAME, centerX, y, { align: "center" });
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(CONGRESS_TREASURER_ROLE, centerX, y, { align: "center" });
  y += 4.5;
  doc.text(CONGRESS_TREASURER_OFFICE, centerX, y, { align: "center" });
}

export type ReceiptConsideration = {
  unpaidClp: number;
  reason: string;
};

export async function downloadCongressPaymentReceiptPdf(input: {
  payment: CongressPayment;
  participantNames: Record<string, string>;
  zoneLabel?: string | null;
  considerations?: Record<string, ReceiptConsideration>;
}): Promise<void> {
  const { payment } = input;
  if (!payment.folio) throw new Error("missing_folio");

  const logo = await loadLogoDataUrl();
  const emittedAt = formatEmittedAt();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN;
  if (logo) {
    doc.addImage(logo, "PNG", MARGIN, y, 28, 28, undefined, "FAST");
  }

  const titleX = logo ? MARGIN + 36 : MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Comprobante de ingreso", titleX, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Congreso Nacional de Varones 2026", titleX, y + 18);
  y += 36;

  if (payment.status === "voided") {
    y = addVoidedStamp(doc, y);
  }

  const fields: Array<[string, string | null | undefined]> = [
    ["Folio", payment.folio],
    ["Fecha de pago", formatPaidOn(payment)],
    ["Medio de pago", methodLabel(payment)],
    ["Banco", payment.bank],
    ["Detalle", payment.note],
    ["Pagador", payment.payerName],
    ["Iglesia", payment.churchName],
    ["Zona", input.zoneLabel],
    ["Monto total", formatClp(payment.amountClp)],
    ["Referencia", payment.receiptRef],
  ];
  if (payment.status === "voided") {
    fields.push(["Motivo anulación", payment.voidReason]);
  }

  doc.setFontSize(11);
  for (const [label, value] of fields) {
    if (!value) continue;
    y = ensureBodySpace(doc, y);
    y = addLabelValue(doc, label, String(value), y);
  }

  y = ensureBodySpace(doc, y + 5, 16);
  doc.setFont("helvetica", "bold");
  doc.text("Distribución", MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  for (const row of payment.allocations) {
    y = ensureBodySpace(doc, y);
    const name =
      input.participantNames[row.registrationId] ??
      `Participante ${row.registrationId.slice(-6)}`;
    const nameLines = doc.splitTextToSize(name, 130);

    doc.setFont("helvetica", "normal");
    doc.text(nameLines, MARGIN, y);
    doc.text(formatClp(row.amountClp), PAGE_WIDTH - MARGIN, y, { align: "right" });
    y += Math.max(7, nameLines.length * 5.5);
    const consideration = input.considerations?.[row.registrationId];
    if (consideration) {
      y = ensureBodySpace(doc, y);
      doc.setFontSize(9);
      doc.text(
        `No cobra ${formatClp(consideration.unpaidClp)} · Autoriza ${consideration.reason || "—"}`,
        MARGIN,
        y
      );
      y += 6;
      doc.setFontSize(10);
    }
  }

  addSignature(doc, y);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    addFooter(doc, emittedAt);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Página ${page} de ${totalPages}`, PAGE_WIDTH - MARGIN, FOOTER_Y + 6, {
      align: "right",
    });
    doc.setTextColor(0);
  }

  doc.save(paymentReceiptFilename(payment.folio));
}

export type ExemptionReceiptPerson = {
  name: string;
  unpaidClp: number;
  authorizer: string;
};

export async function downloadCongressExemptionReceiptPdf(input: {
  authorizedBy: string;
  paidOn: string;
  zoneLabel?: string | null;
  churchName?: string | null;
  people: ExemptionReceiptPerson[];
}): Promise<void> {
  const logo = await loadLogoDataUrl();
  const emittedAt = formatEmittedAt();
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = MARGIN;
  if (logo) {
    doc.addImage(logo, "PNG", MARGIN, y, 28, 28, undefined, "FAST");
  }

  const titleX = logo ? MARGIN + 36 : MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Comprobante de exención", titleX, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Congreso Nacional de Varones 2026", titleX, y + 18);
  y += 36;

  const authorizers = [
    ...new Set(input.people.map((person) => person.authorizer.trim()).filter(Boolean)),
  ];
  const authorizer =
    authorizers.length === 1 ? authorizers[0] : input.authorizedBy.trim() || "Según cada persona";

  const fields: Array<[string, string]> = [
    ["Fecha", input.paidOn || "—"],
    ["Zona", input.zoneLabel?.trim() || "—"],
    ["Iglesia", input.churchName?.trim() || "—"],
    ["Autoriza", authorizer || "—"],
    ["Personas", String(input.people.length)],
    [
      "Total exento",
      formatClp(input.people.reduce((sum, person) => sum + Math.trunc(person.unpaidClp), 0)),
    ],
  ];

  doc.setFontSize(11);
  for (const [label, value] of fields) {
    y = ensureBodySpace(doc, y);
    y = addLabelValue(doc, label, value, y);
  }

  y = ensureBodySpace(doc, y + 5, 16);
  doc.setFont("helvetica", "bold");
  doc.text("Exentos", MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  for (const person of input.people) {
    y = ensureBodySpace(doc, y, 12);
    const nameLines = doc.splitTextToSize(person.name, 120);
    doc.setFont("helvetica", "normal");
    doc.text(nameLines, MARGIN, y);
    doc.text(formatClp(person.unpaidClp), PAGE_WIDTH - MARGIN, y, { align: "right" });
    y += Math.max(6, nameLines.length * 5.5);
    doc.setFontSize(9);
    doc.text(`Autoriza ${person.authorizer.trim() || "—"}`, MARGIN, y);
    y += 6;
    doc.setFontSize(10);
  }

  addSignature(doc, y);

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    addFooter(doc, emittedAt);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Página ${page} de ${totalPages}`, PAGE_WIDTH - MARGIN, FOOTER_Y + 6, {
      align: "right",
    });
    doc.setTextColor(0);
  }

  const day = (input.paidOn || "exencion").replace(/[^\d-]/g, "") || "exencion";
  doc.save(`comprobante-exencion-${day}.pdf`);
}
