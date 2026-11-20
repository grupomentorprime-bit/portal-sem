import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectivePaidOn,
  isValidPaidOn,
  todayPaidOnSantiago,
} from "../../src/core/congress/payment-dates";
import {
  breakdownContributionsByChurch,
  breakdownContributionsByZone,
  breakdownPaymentsByPaidOn,
  normalizePaymentMethod,
  reconcilePostedAllocationsWithCollected,
  summarizeCashBox,
  summarizeContributionClose,
} from "../../src/core/congress/cash-box";
import { distributeProportional } from "../../src/core/congress/payment-distribute";
import { allocatePayment } from "../../src/core/congress/payments";
import { CONGRESS_EVENT_ID } from "../../src/core/congress/constants";
import type { CongressPayment, CongressRegistration } from "../../src/core/congress/types";

function baseReg(over: Partial<CongressRegistration> = {}): CongressRegistration {
  return {
    _id: "reg-1",
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    identity: {
      fullName: "Juan",
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
    },
    zoneId: "zona-1",
    churchName: "Iglesia",
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17_000,
    allocatedPaidClp: 0,
    needsReview: false,
    source: "door",
    version: 1,
    createdAt: "2026-11-17T12:00:00.000Z",
    updatedAt: "2026-11-17T12:00:00.000Z",
    ...over,
  };
}

function pay(over: Partial<CongressPayment> = {}): CongressPayment {
  return {
    _id: "p1",
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    payerType: "individual",
    payerName: "Juan",
    amountClp: 10_000,
    allocations: [],
    unallocatedClp: 0,
    status: "posted",
    createdByUserId: "u1",
    createdAt: "2026-11-21T15:00:00.000Z",
    ...over,
  };
}

describe("payment dates", () => {
  it("valida YYYY-MM-DD real y calcula hoy Santiago", () => {
    assert.equal(isValidPaidOn("2026-11-21"), true);
    assert.equal(isValidPaidOn("2026-13-01"), false);
    assert.equal(isValidPaidOn("21-11-2026"), false);
    assert.match(
      todayPaidOnSantiago(new Date("2026-11-22T03:00:00.000Z")),
      /^\d{4}-\d{2}-\d{2}$/
    );
  });

  it("effectivePaidOn usa paidOn o día Santiago de createdAt", () => {
    assert.equal(
      effectivePaidOn({ paidOn: "2026-11-20", createdAt: "2026-11-21T15:00:00.000Z" }),
      "2026-11-20"
    );
    assert.equal(effectivePaidOn({ createdAt: "2026-11-21T15:00:00.000Z" }), "2026-11-21");
  });
});

describe("cash box", () => {
  it("normaliza method y suma solo posted por tipo", () => {
    assert.equal(normalizePaymentMethod("cash"), "cash");
    assert.equal(normalizePaymentMethod(undefined), "unclassified");

    const result = summarizeCashBox(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-21", amountClp: 5_000 }),
        pay({ _id: "b", method: "transfer", paidOn: "2026-11-21", amountClp: 7_000 }),
        pay({ _id: "c", paidOn: "2026-11-21", amountClp: 3_000 }),
        pay({
          _id: "d",
          method: "cash",
          paidOn: "2026-11-21",
          amountClp: 9_000,
          status: "voided",
        }),
      ],
      { status: "posted" }
    );
    assert.equal(result.totalsClp.cash, 5_000);
    assert.equal(result.totalsClp.transfer, 7_000);
    assert.equal(result.totalsClp.unclassified, 3_000);
    assert.equal(result.totalsClp.other, 0);
    assert.equal(result.totalsClp.total, 15_000);
    assert.equal(result.rows.length, 3);
  });

  it("filtra por método y rango paidOn (legacy via createdAt)", () => {
    const result = summarizeCashBox(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-20", amountClp: 1_000 }),
        pay({ _id: "b", method: "cash", paidOn: "2026-11-22", amountClp: 2_000 }),
        pay({
          _id: "c",
          amountClp: 4_000,
          createdAt: "2026-11-21T18:00:00.000Z",
        }),
      ],
      { method: "unclassified", fromPaidOn: "2026-11-21", toPaidOn: "2026-11-21" }
    );
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0]?._id, "c");
    assert.equal(result.totalsClp.unclassified, 4_000);
  });
});

describe("contribution close", () => {
  it("suma esperado/cobrado/saldo y cuenta estados", () => {
    const result = summarizeContributionClose([
      baseReg({ _id: "1", chargeAmountClp: 17_000, allocatedPaidClp: 0 }),
      baseReg({ _id: "2", chargeAmountClp: 17_000, allocatedPaidClp: 5_000 }),
      baseReg({
        _id: "3",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
        needsReview: false,
      }),
      baseReg({
        _id: "4",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
        needsReview: true,
      }),
      baseReg({ _id: "5", chargeAmountClp: null, allocatedPaidClp: 0 }),
    ]);
    assert.equal(result.expectedClp, 68_000);
    assert.equal(result.collectedClp, 39_000);
    assert.equal(result.remainingClp, 29_000);
    assert.equal(result.countsByStatus.pending, 1);
    assert.equal(result.countsByStatus.partial, 1);
    assert.equal(result.countsByStatus.paid, 1);
    assert.equal(result.countsByStatus.needs_verification, 1);
    assert.equal(result.countsByStatus.no_charge, 1);
  });
});

describe("cash box breakdowns", () => {
  it("agrupa posted por paidOn ascendente e ignora voided en totales", () => {
    const rows = breakdownPaymentsByPaidOn(
      [
        pay({ _id: "a", method: "cash", paidOn: "2026-11-22", amountClp: 2_000 }),
        pay({ _id: "b", method: "cash", paidOn: "2026-11-21", amountClp: 5_000 }),
        pay({
          _id: "c",
          method: "cash",
          paidOn: "2026-11-21",
          amountClp: 9_000,
          status: "voided",
        }),
        pay({ _id: "d", method: "transfer", paidOn: "2026-11-21", amountClp: 3_000 }),
      ],
      { status: "all" }
    );
    assert.deepEqual(rows, [
      { paidOn: "2026-11-21", totalClp: 8_000, count: 2 },
      { paidOn: "2026-11-22", totalClp: 2_000, count: 1 },
    ]);
  });

  it("agrupa por zona (orden zoneId) y por iglesia (saldo desc)", () => {
    const regs = [
      baseReg({
        _id: "a",
        zoneId: "zona-2",
        churchName: "Beta",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 0,
      }),
      baseReg({
        _id: "b",
        zoneId: "zona-1",
        churchName: "Alpha",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 17_000,
      }),
      baseReg({
        _id: "c",
        zoneId: "zona-1",
        churchName: "Alpha",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 5_000,
      }),
    ];
    const byZone = breakdownContributionsByZone(regs);
    assert.equal(byZone[0]?.key, "zona-1");
    assert.equal(byZone[0]?.expectedClp, 34_000);
    assert.equal(byZone[0]?.collectedClp, 22_000);
    assert.equal(byZone[0]?.remainingClp, 12_000);
    assert.equal(byZone[0]?.count, 2);
    assert.equal(byZone[1]?.key, "zona-2");

    const byChurch = breakdownContributionsByChurch(regs);
    assert.equal(byChurch[0]?.key, "Beta");
    assert.equal(byChurch[0]?.remainingClp, 17_000);
    assert.equal(byChurch[1]?.key, "Alpha");
    assert.equal(byChurch[1]?.remainingClp, 12_000);
  });
});

describe("recaudación partida vs caja", () => {
  it("efectivo+transferencia proporcional cuadra caja, cierre y por zona", () => {
    let regs = [1, 2, 3, 4, 5].map((n) =>
      baseReg({
        _id: `reg-${n}`,
        zoneId: "zona-1",
        churchName: "IPN TEST",
        chargeAmountClp: 17_000,
        allocatedPaidClp: 0,
      })
    );
    const balanceRows = regs.map((r) => ({
      registrationId: r._id,
      balanceClp: 17_000,
    }));
    const cashAlloc = distributeProportional(balanceRows, 42_500);
    const transferAlloc = distributeProportional(balanceRows, 42_500);
    assert.equal(
      cashAlloc.reduce((s, a) => s + a.amountClp, 0),
      42_500
    );
    assert.equal(
      transferAlloc.reduce((s, a) => s + a.amountClp, 0),
      42_500
    );

    const cash = allocatePayment({
      paymentId: "pay-cash",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Lider zonal",
      churchName: "IPN TEST",
      amountClp: 42_500,
      method: "cash",
      paidOn: "2026-11-18",
      allocations: cashAlloc,
      createdByUserId: "u1",
      createdAt: "2026-11-18T12:00:00.000Z",
      registrations: regs,
    });
    assert.equal(cash.ok, true);
    if (!cash.ok) return;
    assert.equal(cash.payment.unallocatedClp, 0);
    regs = regs.map((r) => cash.updatedRegistrations.find((u) => u._id === r._id) ?? r);

    const transfer = allocatePayment({
      paymentId: "pay-tr",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Lider zonal",
      churchName: "IPN TEST",
      amountClp: 42_500,
      method: "transfer",
      bank: "BancoEstado",
      paidOn: "2026-11-18",
      allocations: transferAlloc,
      createdByUserId: "u1",
      createdAt: "2026-11-18T12:01:00.000Z",
      registrations: regs,
    });
    assert.equal(transfer.ok, true);
    if (!transfer.ok) return;
    assert.equal(transfer.payment.unallocatedClp, 0);
    regs = regs.map(
      (r) => transfer.updatedRegistrations.find((u) => u._id === r._id) ?? r
    );

    const payments = [cash.payment, transfer.payment];
    const box = summarizeCashBox(payments, { status: "posted" });
    assert.equal(box.totalsClp.cash, 42_500);
    assert.equal(box.totalsClp.transfer, 42_500);
    assert.equal(box.totalsClp.total, 85_000);

    const close = summarizeContributionClose(regs);
    assert.equal(close.expectedClp, 85_000);
    assert.equal(close.collectedClp, 85_000);
    assert.equal(close.remainingClp, 0);
    assert.equal(close.countsByStatus.paid, 5);

    const reconcile = reconcilePostedAllocationsWithCollected(payments, regs);
    assert.equal(reconcile.movementsAllocatedClp, 85_000);
    assert.equal(reconcile.collectedClp, 85_000);
    assert.equal(reconcile.deltaClp, 0);

    const byZone = breakdownContributionsByZone(regs);
    assert.equal(byZone[0]?.key, "zona-1");
    assert.equal(byZone[0]?.expectedClp, 85_000);
    assert.equal(byZone[0]?.collectedClp, 85_000);
    assert.equal(byZone[0]?.remainingClp, 0);
  });
});

describe("allocatePayment method/paidOn", () => {
  it("persiste method y paidOn; rechaza inválidos", () => {
    const ok = allocatePayment({
      paymentId: "pay-m1",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "transfer",
      bank: "Banco de Chile",
      note: "  depósito del sábado  ",
      paidOn: "2026-11-20",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.payment.method, "transfer");
    assert.equal(ok.payment.bank, "Banco de Chile");
    assert.equal(ok.payment.note, "depósito del sábado");
    assert.equal(ok.payment.paidOn, "2026-11-20");

    const missingBank = allocatePayment({
      paymentId: "pay-m1b",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "transfer",
      paidOn: "2026-11-20",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(missingBank.ok, false);
    if (!missingBank.ok) assert.equal(missingBank.error, "invalid_bank");

    const badMethod = allocatePayment({
      paymentId: "pay-m2",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "cheque" as "cash",
      paidOn: "2026-11-20",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(badMethod.ok, false);
    if (!badMethod.ok) assert.equal(badMethod.error, "invalid_method");

    const badDate = allocatePayment({
      paymentId: "pay-m3",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      method: "cash",
      paidOn: "20/11/2026",
      allocations: [{ registrationId: "reg-1", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-21T12:00:00.000Z",
      registrations: [baseReg()],
    });
    assert.equal(badDate.ok, false);
    if (!badDate.ok) assert.equal(badDate.error, "invalid_paid_on");
  });
});
