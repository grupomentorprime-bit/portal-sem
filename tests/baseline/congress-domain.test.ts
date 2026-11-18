import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONGRESS_CONTRIBUTION_CLP,
  CONGRESS_EVENT_ID,
  CONGRESS_NIGHTS,
} from "../../src/core/congress/constants";
import {
  applyAttendanceChange,
  emptyAttendance,
  setAttendanceDay,
} from "../../src/core/congress/attendance";
import {
  buildChargeAmountClp,
  eligibleForCharge,
  remainingBalanceClp,
} from "../../src/core/congress/charges";
import {
  findDuplicateRegistrationId,
  registrationDuplicateKey,
  shouldAutoMergeBySimilarName,
} from "../../src/core/congress/duplicates";
import {
  canAssignBed,
  churchRequestIsAssignment,
  occupiedBedsForNight,
} from "../../src/core/congress/lodging";
import { allocatePayment } from "../../src/core/congress/payments";
import type { CongressRegistration } from "../../src/core/congress/types";

function reg(
  overrides: Partial<CongressRegistration> & Pick<CongressRegistration, "_id">
): CongressRegistration {
  return {
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    source: "import",
    zoneId: "zona-1",
    churchName: "Prueba",
    attendance: emptyAttendance(),
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    allocatedPaidClp: 0,
    needsReview: false,
    version: 1,
    createdAt: "2026-11-17T00:00:00.000Z",
    updatedAt: "2026-11-17T00:00:00.000Z",
    ...overrides,
    identity: {
      fullName: "Juan Pérez",
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
      ...overrides.identity,
    },
  };
}

describe("congress domain charges", () => {
  it("cobra 17000 solo cuando hay persona identificada", () => {
    assert.equal(eligibleForCharge({ fullName: "Pedro" }), true);
    assert.equal(buildChargeAmountClp({ fullName: "Pedro" }), 17_000);
    assert.equal(eligibleForCharge({ fullName: "  " }), false);
    assert.equal(buildChargeAmountClp({ fullName: "" }), null);
    assert.equal(CONGRESS_CONTRIBUTION_CLP, 17_000);
  });
});

describe("congress domain payments", () => {
  it("un abono grupal no deja dos saldos en cero si el monto no alcanza", () => {
    const a = reg({ _id: "reg-a" });
    const b = reg({ _id: "reg-b", identity: { fullName: "Luis", rut: null, email: null, phone: null, status: "provisional" } });
    const result = allocatePayment({
      paymentId: "pay-1",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Iglesia Centro",
      amountClp: 17_000,
      allocations: [
        { registrationId: "reg-a", amountClp: 17_000 },
        { registrationId: "reg-b", amountClp: 17_000 },
      ],
      createdByUserId: "user-1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a, b],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "allocation_exceeds_payment");
  });

  it("imputa exactamente y deja saldo no imputado identificado", () => {
    const a = reg({ _id: "reg-a" });
    const b = reg({ _id: "reg-b" });
    const result = allocatePayment({
      paymentId: "pay-2",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Iglesia Centro",
      amountClp: 40_000,
      allocations: [
        { registrationId: "reg-a", amountClp: 17_000 },
        { registrationId: "reg-b", amountClp: 10_000 },
      ],
      createdByUserId: "user-1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a, b],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.payment.unallocatedClp, 13_000);
    assert.equal(result.updatedRegistrations.find((r) => r._id === "reg-a")?.allocatedPaidClp, 17_000);
    assert.equal(result.updatedRegistrations.find((r) => r._id === "reg-b")?.allocatedPaidClp, 10_000);
    assert.equal(remainingBalanceClp(result.updatedRegistrations.find((r) => r._id === "reg-b")!), 7_000);
  });

  it("rechaza imputar más que el saldo restante (anti doble cobertura)", () => {
    const a = reg({ _id: "reg-a", allocatedPaidClp: 17_000 });
    const result = allocatePayment({
      paymentId: "pay-3",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "Juan",
      amountClp: 17_000,
      allocations: [{ registrationId: "reg-a", amountClp: 17_000 }],
      createdByUserId: "user-1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "allocation_exceeds_balance");
  });

  it("no genera cargo ni imputación para registro sin persona", () => {
    assert.equal(buildChargeAmountClp({ fullName: "" }), null);
    const ghost = reg({
      _id: "reg-ghost",
      identity: { fullName: "", rut: null, email: null, phone: null, status: "provisional" },
      chargeAmountClp: null,
    });
    const result = allocatePayment({
      paymentId: "pay-4",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Iglesia",
      amountClp: 17_000,
      allocations: [{ registrationId: "reg-ghost", amountClp: 17_000 }],
      createdByUserId: "user-1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [ghost],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "no_charge");
  });
});

describe("congress domain attendance", () => {
  it("marca sábado y domingo de forma independiente", () => {
    let days = emptyAttendance();
    days = setAttendanceDay(days, "saturday", true);
    assert.equal(days.saturday, true);
    assert.equal(days.sunday, null);
    days = setAttendanceDay(days, "sunday", false);
    assert.equal(days.saturday, true);
    assert.equal(days.sunday, false);
  });

  it("conserva la primera hora de llegada ante present=true repetido", () => {
    const first = applyAttendanceChange({
      attendance: { saturday: null, sunday: null },
      attendanceMeta: {},
      attendanceHistory: [],
      day: "saturday",
      present: true,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const second = applyAttendanceChange({
      attendance: first.attendance,
      attendanceMeta: first.attendanceMeta,
      attendanceHistory: first.attendanceHistory,
      day: "saturday",
      present: true,
      nowIso: "2026-11-21T15:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.attendanceMeta.saturdayMarkedAt, "2026-11-21T12:00:00.000Z");
    assert.equal(second.attendanceHistory.length, first.attendanceHistory.length);
  });

  it("permite desmarcar sin motivo y conserva historial", () => {
    const marked = applyAttendanceChange({
      attendance: { saturday: null, sunday: null },
      attendanceMeta: {},
      attendanceHistory: [],
      day: "saturday",
      present: true,
      nowIso: "2026-11-21T12:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(marked.ok, true);
    if (!marked.ok) return;
    const clear = applyAttendanceChange({
      attendance: marked.attendance,
      attendanceMeta: marked.attendanceMeta,
      attendanceHistory: marked.attendanceHistory,
      day: "saturday",
      present: null,
      nowIso: "2026-11-21T13:00:00.000Z",
      actorUserId: "u1",
    });
    assert.equal(clear.ok, true);
    if (!clear.ok) return;
    assert.equal(clear.attendance.saturday, null);
    assert.equal(clear.attendanceMeta.saturdayMarkedAt, null);
    assert.equal(clear.attendanceHistory.length, 2);
    assert.equal(clear.attendanceHistory[1]?.previousMarkedAt, "2026-11-21T12:00:00.000Z");
  });
});

describe("congress domain duplicates", () => {
  it("usa RUT canónico y provisional distinto sin inventar merge por nombre", () => {
    const key = registrationDuplicateKey({ rut: "12.345.678-5" });
    assert.equal(key, "rut:12.345.678-5");
    assert.equal(registrationDuplicateKey({ provisionalKey: "door-abc" }), "prov:door-abc");
    assert.equal(registrationDuplicateKey({}), null);
    assert.equal(shouldAutoMergeBySimilarName(), false);
    const dup = findDuplicateRegistrationId(
      [{ _id: "a", rut: "12.345.678-5" }],
      { rut: "12345678-5" }
    );
    assert.equal(dup, "a");
  });
});

describe("congress domain lodging", () => {
  it("no asigna sobre el cupo de la noche y no trata la solicitud de iglesia como cama", () => {
    assert.deepEqual([...CONGRESS_NIGHTS], ["2026-11-20", "2026-11-21"]);
    const occupied = occupiedBedsForNight(
      [
        { homeId: "h1", night: "2026-11-20" },
        { homeId: "h1", night: "2026-11-20" },
        { homeId: "h1", night: "2026-11-21" },
      ],
      "h1",
      "2026-11-20"
    );
    assert.equal(occupied, 2);
    assert.equal(canAssignBed({ capacity: 2, occupied: 2 }), false);
    assert.equal(canAssignBed({ capacity: 2, occupied: 1 }), true);
    assert.equal(churchRequestIsAssignment(), false);
  });
});
