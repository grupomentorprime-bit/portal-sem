import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPaymentFolio,
  paymentReceiptFilename,
} from "../../src/core/congress/payment-folio";

describe("congress payment folio", () => {
  it("formatea CV-YYYY-##### con padding", () => {
    assert.equal(formatPaymentFolio(42), "CV-2026-00042");
    assert.equal(formatPaymentFolio(1, 2026), "CV-2026-00001");
  });

  it("rechaza secuencia no positiva", () => {
    assert.throws(() => formatPaymentFolio(0));
    assert.throws(() => formatPaymentFolio(-1));
  });

  it("arma nombre de archivo estable", () => {
    assert.equal(
      paymentReceiptFilename("CV-2026-00042"),
      "comprobante-ingreso-CV-2026-00042.pdf"
    );
  });
});