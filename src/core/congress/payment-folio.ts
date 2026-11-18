import { CONGRESS_PAYMENT_FOLIO_YEAR } from "@/core/congress/constants";

export function formatPaymentFolio(
  seq: number,
  year: number = CONGRESS_PAYMENT_FOLIO_YEAR
): string {
  if (!Number.isInteger(seq) || seq <= 0) {
    throw new Error("invalid_folio_sequence");
  }
  return `CV-${year}-${String(seq).padStart(5, "0")}`;
}

export function paymentReceiptFilename(folio: string): string {
  return `comprobante-ingreso-${folio}.pdf`;
}