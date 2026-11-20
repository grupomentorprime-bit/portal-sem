import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeChargeConsideration,
  applyChargeChange,
  isExplicitlyExempt,
  planAuthorizedLesserPayment,
} from "../../src/core/congress/charge";
import { CONGRESS_CONTRIBUTION_CLP } from "../../src/core/congress/constants";
import { contributionStatusLabel } from "../../src/components/admin/congress/labels";
import { remainingBalanceClp } from "../../src/core/congress/charges";
import { summarizeContributionClose } from "../../src/core/congress/cash-box";
import { toReportPerson } from "../../src/core/congress/ops-reports";
import type { CongressRegistration } from "../../src/core/congress/types";

describe("applyChargeChange", () => {
  it("exenta con motivo y bloquea si hay imputado", () => {
    const blocked = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 1000,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.equal(blocked.error, "has_allocations");

    const ok = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.chargeAmountClp, null);
    assert.equal(ok.chargeHistory.length, 1);
    assert.equal(ok.chargeHistory[0]?.action, "exempt");
  });

  it("idempotente si ya sin cargo; restore exige historial exempt", () => {
    const again = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [
        {
          action: "exempt",
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: null,
          reason: "Invitado",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
      action: "exempt",
      reason: "otra",
      nowIso: "2026-11-21T13:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.idempotent, true);
    assert.equal(again.chargeHistory.length, 1);

    const noHistory = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "restore",
      reason: "Error",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(noHistory.ok, false);
    if (noHistory.ok) return;
    assert.equal(noHistory.error, "not_exempt");

    const restored = applyChargeChange({
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      chargeHistory: again.chargeHistory,
      action: "restore",
      reason: "Debía pagar",
      nowIso: "2026-11-21T14:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.chargeAmountClp, CONGRESS_CONTRIBUTION_CLP);
    assert.equal(restored.chargeHistory.at(-1)?.action, "restore");
  });

  it("no cobra una parte y deja el saldo anotado", () => {
    const partial = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "reduce",
      reason: "Staff",
      waiveClp: 5_000,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(partial.ok, true);
    if (!partial.ok) return;
    assert.equal(partial.chargeAmountClp, CONGRESS_CONTRIBUTION_CLP - 5_000);
    assert.equal(partial.chargeHistory[0]?.action, "reduce");
    assert.equal(partial.chargeHistory[0]?.reason, "Staff");

    const tooMuch = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 15_000,
      chargeHistory: [],
      action: "reduce",
      reason: "Cortesía",
      waiveClp: 5_000,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(tooMuch.ok, false);
    if (tooMuch.ok) return;
    assert.equal(tooMuch.error, "below_paid");
  });

  it("se cobra 10000 y el resto del aporte no queda como saldo", () => {
    const stated = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 10_000,
      chargeHistory: [],
      action: "reduce",
      reason: "Acuerdo de la iglesia",
      chargeClp: 10_000,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(stated.ok, true);
    if (!stated.ok) return;
    assert.equal(stated.chargeAmountClp, 10_000);

    const corrected = applyChargeChange({
      chargeAmountClp: 7_000,
      allocatedPaidClp: 0,
      chargeHistory: stated.chargeHistory,
      action: "reduce",
      reason: "Acuerdo de la iglesia",
      chargeClp: 10_000,
      nowIso: "2026-11-21T12:05:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(corrected.ok, true);
    if (!corrected.ok) return;
    assert.equal(corrected.chargeAmountClp, 10_000);
  });

  it("exige motivo no vacío", () => {
    const r = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "  ",
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.error, "reason_required");
  });
});

describe("planAuthorizedLesserPayment", () => {
  it("cobra el monto menor y no deja el resto como saldo", () => {
    const plan = planAuthorizedLesserPayment({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      payNowClp: 7_000,
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.reduce, true);
    assert.equal(plan.nextChargeClp, 7_000);
    assert.equal(plan.paymentClp, 7_000);

    const applied = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "reduce",
      reason: "Tesorero",
      chargeClp: plan.nextChargeClp,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(applied.ok, true);
    if (!applied.ok) return;
    assert.equal(applied.chargeAmountClp, 7_000);
    assert.equal(
      remainingBalanceClp({
        chargeAmountClp: applied.chargeAmountClp,
        allocatedPaidClp: plan.paymentClp,
      }),
      0
    );
  });

  it("si el aporte ya es menor, el pago cubre ese saldo", () => {
    const plan = planAuthorizedLesserPayment({
      chargeAmountClp: 7_000,
      allocatedPaidClp: 0,
      payNowClp: 7_000,
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.reduce, false);
    assert.equal(plan.paymentClp, 7_000);
  });

  it("rechaza un monto sobre el saldo", () => {
    const plan = planAuthorizedLesserPayment({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      payNowClp: 20_000,
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.error, "above_balance");
  });
});

describe("activeChargeConsideration", () => {
  it("refleja el total y la parte en el estado", () => {
    const exempt = {
      chargeAmountClp: null,
      allocatedPaidClp: 0,
      needsReview: false,
      chargeHistory: [
        {
          action: "exempt" as const,
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: null,
          reason: "Invitado",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
    };
    assert.deepEqual(activeChargeConsideration(exempt), {
      unpaidClp: CONGRESS_CONTRIBUTION_CLP,
      reason: "Invitado",
      total: true,
    });
    assert.match(contributionStatusLabel("no_charge", exempt), /Exento/);
    assert.match(contributionStatusLabel("no_charge", exempt), /Invitado/);
    assert.match(contributionStatusLabel("no_charge", exempt), /no paga/);

    const partial = {
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP - 7_000,
      allocatedPaidClp: 0,
      needsReview: false,
      chargeHistory: [
        {
          action: "reduce" as const,
          previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
          nextChargeAmountClp: CONGRESS_CONTRIBUTION_CLP - 7_000,
          reason: "Cortesía",
          at: "2026-11-21T12:00:00.000Z",
          actorUserId: "u1",
        },
      ],
    };
    assert.equal(activeChargeConsideration(partial)?.unpaidClp, 7_000);
    assert.match(contributionStatusLabel("pending", partial), /Pendiente/);
    assert.match(contributionStatusLabel("pending", partial), /no paga/);
    assert.match(contributionStatusLabel("pending", partial), /Cortesía/);

    const restored = applyChargeChange({
      chargeAmountClp: partial.chargeAmountClp,
      allocatedPaidClp: 0,
      chargeHistory: partial.chargeHistory,
      action: "restore",
      reason: "Debe pagar",
      nowIso: "2026-11-21T13:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(
      activeChargeConsideration({
        chargeAmountClp: restored.chargeAmountClp,
        chargeHistory: restored.chargeHistory,
      }),
      null
    );
  });

  it("condona el saldo que queda después de un abono", () => {
    const waived = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 10_000,
      chargeHistory: [],
      action: "reduce",
      reason: "Acuerdo de la iglesia",
      waiveClp: 7_000,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(waived.ok, true);
    if (!waived.ok) return;
    assert.equal(waived.chargeAmountClp, 10_000);
    const reg = {
      chargeAmountClp: waived.chargeAmountClp,
      allocatedPaidClp: 10_000,
      needsReview: false,
      chargeHistory: waived.chargeHistory,
    };
    assert.equal(activeChargeConsideration(reg)?.unpaidClp, 7_000);
    assert.match(contributionStatusLabel("paid", reg), /Pagado/);
    assert.match(contributionStatusLabel("paid", reg), /Acuerdo de la iglesia/);
  });
});

function ficha(
  chargeAmountClp: number | null,
  chargeHistory: CongressRegistration["chargeHistory"],
  allocatedPaidClp = 0
): CongressRegistration {
  return {
    _id: "r1",
    tenantId: "ipn-chile",
    eventId: "ipn-congreso-varones-2026",
    source: "form",
    zoneId: "zona-1",
    churchName: "IPN PRUEBA",
    identity: {
      fullName: "Hno Jose",
      rut: null,
      email: null,
      phone: null,
      status: "verified",
    },
    chargeAmountClp,
    allocatedPaidClp,
    chargeHistory,
    needsReview: false,
    attendance: { saturday: null, sunday: null },
    expectedDays: { saturday: true, sunday: true },
    lodgingNeed: "unknown",
    isZoneLeader: false,
    isChurchGroupLeader: false,
    version: 1,
    createdAt: "2026-11-19T12:00:00.000Z",
    updatedAt: "2026-11-19T12:00:00.000Z",
  } as CongressRegistration;
}

function snapshot(reg: CongressRegistration) {
  const close = summarizeContributionClose([reg]);
  const person = toReportPerson(reg);
  return {
    charge: reg.chargeAmountClp,
    balance: remainingBalanceClp(reg),
    label: contributionStatusLabel(
      person.financeStatus,
      reg
    ),
    cajaExpected: close.expectedClp,
    cajaRemaining: close.remainingClp,
    cajaCollected: close.collectedClp,
    reportCharge: person.chargeClp,
    reportBalance: person.balanceClp,
    reportLabel: person.financeLabel,
  };
}

describe("exento y parcial cuadran caja, reporte y cuenta", () => {
  const now = "2026-11-19T21:00:00.000Z";

  it("exento total sale de lo por cobrar y restaurar vuelve a $17.000", () => {
    const start = ficha(CONGRESS_CONTRIBUTION_CLP, []);
    const before = snapshot(start);
    assert.equal(before.balance, 17_000);
    assert.equal(before.cajaExpected, 17_000);
    assert.equal(before.reportBalance, 17_000);
    assert.match(before.label, /Pendiente/);

    const exempt = applyChargeChange({
      chargeAmountClp: start.chargeAmountClp,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "exempt",
      reason: "Invitado",
      nowIso: now,
      actorUserId: "u1",
    });
    assert.equal(exempt.ok, true);
    if (!exempt.ok) return;
    const exempted = ficha(exempt.chargeAmountClp, exempt.chargeHistory);
    const mid = snapshot(exempted);
    assert.equal(mid.charge, null);
    assert.equal(mid.balance, 0);
    assert.equal(mid.cajaExpected, 0);
    assert.equal(mid.cajaRemaining, 0);
    assert.equal(mid.reportCharge, null);
    assert.equal(mid.reportBalance, 0);
    assert.match(mid.label, /Exento/);
    assert.match(mid.reportLabel, /Exento/);
    assert.equal(activeChargeConsideration(exempted)?.unpaidClp, 17_000);

    const back = applyChargeChange({
      chargeAmountClp: exempt.chargeAmountClp,
      allocatedPaidClp: 0,
      chargeHistory: exempt.chargeHistory,
      action: "restore",
      reason: "Vuelve a cobrar",
      nowIso: now,
      actorUserId: "u1",
    });
    assert.equal(back.ok, true);
    if (!back.ok) return;
    const restored = ficha(back.chargeAmountClp, back.chargeHistory);
    const after = snapshot(restored);
    assert.equal(after.charge, 17_000);
    assert.equal(after.balance, 17_000);
    assert.equal(after.cajaExpected, 17_000);
    assert.equal(after.reportBalance, 17_000);
    assert.match(after.label, /Pendiente/);
    assert.equal(activeChargeConsideration(restored), null);
  });

  it("parcial baja el mismo saldo en la cuenta, la caja y el reporte", () => {
    const partial = applyChargeChange({
      chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
      allocatedPaidClp: 0,
      chargeHistory: [],
      action: "reduce",
      reason: "Cortesía",
      waiveClp: 12_000,
      nowIso: now,
      actorUserId: "u1",
    });
    assert.equal(partial.ok, true);
    if (!partial.ok) return;
    const reg = ficha(partial.chargeAmountClp, partial.chargeHistory);
    const view = snapshot(reg);
    assert.equal(view.charge, 5_000);
    assert.equal(view.balance, 5_000);
    assert.equal(view.cajaExpected, 5_000);
    assert.equal(view.cajaRemaining, 5_000);
    assert.equal(view.cajaCollected, 0);
    assert.equal(view.reportCharge, 5_000);
    assert.equal(view.reportBalance, 5_000);
    assert.match(view.label, /Pendiente/);
    assert.match(view.label, /5\.000|5000/);
    assert.equal(activeChargeConsideration(reg)?.unpaidClp, 12_000);

    const back = applyChargeChange({
      chargeAmountClp: partial.chargeAmountClp,
      allocatedPaidClp: 0,
      chargeHistory: partial.chargeHistory,
      action: "restore",
      reason: "Vuelve a cobrar",
      nowIso: now,
      actorUserId: "u1",
    });
    assert.equal(back.ok, true);
    if (!back.ok) return;
    const restored = snapshot(ficha(back.chargeAmountClp, back.chargeHistory));
    assert.equal(restored.cajaExpected, 17_000);
    assert.equal(restored.balance, 17_000);
    assert.equal(restored.reportBalance, 17_000);
  });
});

describe("isExplicitlyExempt", () => {
  it("distingue exento explícito de sin cargo", () => {
    assert.equal(
      isExplicitlyExempt({ chargeAmountClp: null, chargeHistory: [] }),
      false
    );
    assert.equal(
      isExplicitlyExempt({
        chargeAmountClp: null,
        chargeHistory: [
          {
            action: "exempt",
            previousChargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
            nextChargeAmountClp: null,
            reason: "Staff",
            at: "2026-11-21T12:00:00.000Z",
            actorUserId: "u1",
          },
        ],
      }),
      true
    );
  });
});
