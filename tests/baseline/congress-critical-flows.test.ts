import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyAttendance, setAttendanceDay } from "../../src/core/congress/attendance";
import { CONGRESS_CONTRIBUTION_CLP, CONGRESS_EVENT_ID } from "../../src/core/congress/constants";
import { attachRutToRegistration } from "../../src/core/congress/identity-attach";
import { planCongressImportCommit } from "../../src/core/congress/import-commit";
import { buildCongressImportPreview } from "../../src/core/congress/import-preview";
import {
  canAssignBed,
  churchRequestIsAssignment,
  resolveLastBedRace,
  summarizeLodgingDemand,
} from "../../src/core/congress/lodging";
import { allocatePayment, voidPayment } from "../../src/core/congress/payments";
import type { CongressRegistration } from "../../src/core/congress/types";

function reg(
  overrides: Partial<CongressRegistration> & Pick<CongressRegistration, "_id">
): CongressRegistration {
  return {
    tenantId: "ipn-chile",
    eventId: CONGRESS_EVENT_ID,
    source: "door",
    zoneId: "zona-1",
    churchName: "Prueba",
    identity: {
      fullName: "Participante",
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
    },
    attendance: emptyAttendance(),
    chargeAmountClp: CONGRESS_CONTRIBUTION_CLP,
    allocatedPaidClp: 0,
    needsReview: true,
    version: 1,
    createdAt: "2026-11-17T00:00:00.000Z",
    updatedAt: "2026-11-17T00:00:00.000Z",
    ...overrides,
    identity: {
      fullName: "Participante",
      rut: null,
      email: null,
      phone: null,
      status: "provisional",
      ...overrides.identity,
    },
  };
}

describe("congress critical flows", () => {
  it("asistencia ambos días vs solo domingo son independientes", () => {
    let both = emptyAttendance();
    both = setAttendanceDay(both, "saturday", true);
    both = setAttendanceDay(both, "sunday", true);
    let sundayOnly = emptyAttendance();
    sundayOnly = setAttendanceDay(sundayOnly, "sunday", true);
    assert.equal(both.saturday, true);
    assert.equal(both.sunday, true);
    assert.equal(sundayOnly.saturday, null);
    assert.equal(sundayOnly.sunday, true);
  });

  it("alta provisional + RUT posterior no duplica", () => {
    const provisional = reg({ _id: "door-1", identity: { fullName: "Pedro Door", rut: null, email: null, phone: null, status: "provisional" } });
    const other = reg({
      _id: "other",
      identity: { fullName: "Otro", rut: "11.111.111-1", email: null, phone: null, status: "verified" },
    });
    const ok = attachRutToRegistration({
      registration: provisional,
      rut: "12.345.678-5",
      existing: [provisional, other],
      now: "2026-11-17T12:00:00.000Z",
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) return;
    assert.equal(ok.registration.identity.rut, "12.345.678-5");
    assert.equal(ok.registration.identity.status, "verified");
    assert.equal(ok.registration.needsReview, false);

    const dup = attachRutToRegistration({
      registration: reg({ _id: "door-2" }),
      rut: "12.345.678-5",
      existing: [ok.registration, other],
      now: "2026-11-17T12:01:00.000Z",
    });
    assert.equal(dup.ok, false);
    if (!dup.ok) assert.equal(dup.error, "duplicate_rut");
  });

  it("pago grupal parcial + pago individual completa saldos", () => {
    const a = reg({ _id: "a", identity: { fullName: "A", rut: null, email: null, phone: null, status: "provisional" } });
    const b = reg({ _id: "b", identity: { fullName: "B", rut: null, email: null, phone: null, status: "provisional" } });
    const group = allocatePayment({
      paymentId: "p1",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Iglesia",
      amountClp: 20_000,
      allocations: [
        { registrationId: "a", amountClp: 10_000 },
        { registrationId: "b", amountClp: 10_000 },
      ],
      createdByUserId: "u1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a, b],
    });
    assert.equal(group.ok, true);
    if (!group.ok) return;
    assert.equal(group.payment.unallocatedClp, 0);

    const a2 = group.updatedRegistrations.find((r) => r._id === "a")!;
    const individual = allocatePayment({
      paymentId: "p2",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "A",
      amountClp: 7_000,
      allocations: [{ registrationId: "a", amountClp: 7_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-17T12:05:00.000Z",
      registrations: [a2, group.updatedRegistrations.find((r) => r._id === "b")!],
    });
    assert.equal(individual.ok, true);
    if (!individual.ok) return;
    assert.equal(individual.updatedRegistrations[0]?.allocatedPaidClp, 17_000);
  });

  it("doble toggle de asistencia conserva el otro día", () => {
    let days = setAttendanceDay(emptyAttendance(), "saturday", true);
    days = setAttendanceDay(days, "saturday", true);
    days = setAttendanceDay(days, "sunday", false);
    days = setAttendanceDay(days, "saturday", false);
    assert.equal(days.saturday, false);
    assert.equal(days.sunday, false);
  });

  it("anulación revierte imputaciones y conserva el movimiento", () => {
    const a = reg({ _id: "a" });
    const posted = allocatePayment({
      paymentId: "pay-void",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "individual",
      payerName: "A",
      amountClp: 17_000,
      allocations: [{ registrationId: "a", amountClp: 17_000 }],
      createdByUserId: "u1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a],
    });
    assert.equal(posted.ok, true);
    if (!posted.ok) return;
    const voided = voidPayment({
      payment: posted.payment,
      registrations: posted.updatedRegistrations,
      reason: "Duplicado de comprobante",
      voidedByUserId: "admin",
      voidedAt: "2026-11-17T13:00:00.000Z",
    });
    assert.equal(voided.ok, true);
    if (!voided.ok) return;
    assert.equal(voided.payment.status, "voided");
    assert.equal(voided.payment._id, "pay-void");
    assert.equal(voided.updatedRegistrations[0]?.allocatedPaidClp, 0);
    assert.equal(voided.updatedRegistrations[0]?.chargeAmountClp, 17_000);
    assert.equal(
      (voided.updatedRegistrations[0]?.chargeAmountClp ?? 0) -
        (voided.updatedRegistrations[0]?.allocatedPaidClp ?? 0),
      17_000
    );
    assert.equal(voided.payment.allocations.length, 1);
    assert.equal(voided.payment.voidedAllocations?.[0]?.amountClp, 17_000);
    const again = voidPayment({
      payment: voided.payment,
      registrations: voided.updatedRegistrations,
      reason: "Otra vez",
      voidedByUserId: "admin",
      voidedAt: "2026-11-17T14:00:00.000Z",
    });
    assert.equal(again.ok, false);
  });

  it("anulación de pago grupal restaura pendientes sin borrar cargos", () => {
    const a = reg({ _id: "g-a", identity: { fullName: "A", rut: null, email: null, phone: null, status: "provisional" } });
    const b = reg({ _id: "g-b", identity: { fullName: "B", rut: null, email: null, phone: null, status: "provisional" } });
    const posted = allocatePayment({
      paymentId: "pay-group-void",
      tenantId: "ipn-chile",
      eventId: CONGRESS_EVENT_ID,
      payerType: "church",
      payerName: "Iglesia Prueba",
      churchName: "Iglesia Prueba",
      amountClp: 34_000,
      allocations: [
        { registrationId: "g-a", amountClp: 17_000 },
        { registrationId: "g-b", amountClp: 17_000 },
      ],
      createdByUserId: "u1",
      createdAt: "2026-11-17T12:00:00.000Z",
      registrations: [a, b],
    });
    assert.equal(posted.ok, true);
    if (!posted.ok) return;
    assert.equal(posted.updatedRegistrations[0]?.allocatedPaidClp, 17_000);
    assert.equal(posted.updatedRegistrations[1]?.allocatedPaidClp, 17_000);

    const voided = voidPayment({
      payment: posted.payment,
      registrations: posted.updatedRegistrations,
      reason: "Comprobante grupal duplicado",
      voidedByUserId: "admin",
      voidedAt: "2026-11-17T13:00:00.000Z",
    });
    assert.equal(voided.ok, true);
    if (!voided.ok) return;
    assert.equal(voided.payment.status, "voided");
    assert.equal(voided.payment.amountClp, 34_000);
    assert.equal(voided.payment.allocations.length, 2);
    for (const updated of voided.updatedRegistrations) {
      assert.equal(updated.allocatedPaidClp, 0);
      assert.equal(updated.chargeAmountClp, 17_000);
    }
  });

  it("último cupo: una asignación gana y la otra se rechaza", () => {
    assert.equal(canAssignBed({ capacity: 1, occupied: 0 }), true);
    assert.equal(canAssignBed({ capacity: 1, occupied: 1 }), false);
    const race = resolveLastBedRace({ capacity: 1, occupiedBefore: 0, winners: 2 });
    assert.equal(race.accepted, 1);
    assert.equal(race.rejected, 1);
    assert.equal(churchRequestIsAssignment(), false);
    const demand = summarizeLodgingDemand({ requestedBeds: 10, assignedBeds: 3 });
    assert.equal(demand.unmetRequestBeds, 7);
  });

  it("reimportación del mismo Excel no crea fichas de gaps ni duplica filas", () => {
    const preview = buildCongressImportPreview({
      peopleRows: [
        {
          zoneId: "zona-1",
          zoneLabel: "Z1",
          churchName: "Quilicura",
          fullName: "Hno David Orellana",
          expectedDayLabel: "SÁBADO Y DOMINGO",
          sheetRow: 3,
        },
        {
          zoneId: "zona-8",
          zoneLabel: "Z8",
          churchName: "Nacimiento",
          fullName: "",
          expectedDayLabel: "SÁBADO Y DOMINGO",
          sheetRow: 19,
        },
      ],
    });
    assert.equal(preview.namedPeople.length, 1);
    assert.equal(preview.quantityGaps.length, 1);

    const existing: CongressRegistration[] = [
      reg({
        _id: "imp-1",
        source: "import",
        zoneId: "zona-1",
        churchName: "Quilicura",
        importRowId: "irow:zona-1:3:hno david orellana",
        identity: {
          fullName: "Hno David Orellana",
          rut: null,
          email: null,
          phone: null,
          status: "provisional",
        },
      }),
    ];

    const plan = planCongressImportCommit({
      preview,
      existing,
      batchId: "batch-1",
    });
    assert.equal(plan.summary.createCount, 0);
    assert.equal(plan.summary.skipCount, 1);
    assert.equal(plan.gapsKept.length, 1);
    assert.equal(plan.toCreate.length, 0);
  });
});
