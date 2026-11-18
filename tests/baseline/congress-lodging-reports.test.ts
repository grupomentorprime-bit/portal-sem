import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLodgingCapacityReport,
  buildLodgingPendingReport,
} from "../../src/core/congress/lodging-reports";
import type {
  CongressLodgingAssignment,
  CongressLodgingHome,
  CongressRegistration,
} from "../../src/core/congress/types";

function home(
  partial: Partial<CongressLodgingHome> & Pick<CongressLodgingHome, "_id" | "name">
): CongressLodgingHome {
  return {
    tenantId: "t",
    eventId: "e",
    contactName: null,
    contactPhone: null,
    address: null,
    notes: null,
    capacityByNight: { "2026-11-20": 2, "2026-11-21": 2 },
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function reg(
  partial: Partial<CongressRegistration> &
    Pick<CongressRegistration, "_id"> & { fullName: string }
): CongressRegistration {
  const { fullName, ...rest } = partial;
  return {
    tenantId: "t",
    eventId: "e",
    source: "door",
    zoneId: "zona-2",
    churchName: "IPN LA VID",
    identity: {
      fullName,
      rut: null,
      email: null,
      phone: "+56911111111",
      status: "provisional",
    },
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: null,
    allocatedPaidClp: 0,
    needsReview: false,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...rest,
  };
}

function asg(
  partial: Partial<CongressLodgingAssignment> &
    Pick<CongressLodgingAssignment, "_id" | "homeId" | "registrationId" | "night" | "status">
): CongressLodgingAssignment {
  return {
    tenantId: "t",
    eventId: "e",
    confirmed: partial.status === "confirmed",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("buildLodgingCapacityReport", () => {
  it("cuenta cupos, ocupadas y libres, e ignora canceladas", () => {
    const report = buildLodgingCapacityReport({
      homes: [
        home({
          _id: "h-b",
          name: "Casa Beta",
          contactPhone: "987654321",
          capacityByNight: { "2026-11-20": 1, "2026-11-21": 1 },
        }),
        home({
          _id: "h-a",
          name: "Casa Alfa",
          address: "Calle 1",
          capacityByNight: { "2026-11-20": 2, "2026-11-21": 3 },
        }),
      ],
      assignments: [
        asg({
          _id: "a1",
          homeId: "h-a",
          registrationId: "r1",
          night: "2026-11-20",
          status: "assigned",
        }),
        asg({
          _id: "a2",
          homeId: "h-a",
          registrationId: "r2",
          night: "2026-11-20",
          status: "confirmed",
        }),
        asg({
          _id: "a3",
          homeId: "h-b",
          registrationId: "r3",
          night: "2026-11-21",
          status: "cancelled",
        }),
      ],
      registrations: [],
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });

    assert.equal(report.homeCount, 2);
    assert.equal(report.homes[0]?.name, "Casa Alfa");
    assert.equal(report.homes[0]?.address, "Calle 1");
    assert.equal(report.homes[0]?.fridayUsed, 2);
    assert.equal(report.homes[0]?.fridayFree, 0);
    assert.equal(report.homes[0]?.saturdayUsed, 0);
    assert.equal(report.homes[0]?.saturdayFree, 3);
    assert.equal(report.homes[1]?.name, "Casa Beta");
    assert.equal(report.homes[1]?.hostPhone, "987654321");
    assert.equal(report.homes[1]?.saturdayUsed, 0);
    assert.equal(report.fridayCapacity, 3);
    assert.equal(report.fridayUsed, 2);
    assert.equal(report.fridayFree, 1);
    assert.equal(report.saturdayCapacity, 4);
    assert.equal(report.saturdayUsed, 0);
    assert.equal(report.saturdayFree, 4);
  });

  it("muestra libres negativas si hay más asignados que cupos", () => {
    const report = buildLodgingCapacityReport({
      homes: [
        home({
          _id: "h1",
          name: "Chico",
          capacityByNight: { "2026-11-20": 1, "2026-11-21": 0 },
        }),
      ],
      assignments: [
        asg({ _id: "a1", homeId: "h1", registrationId: "r1", night: "2026-11-20", status: "assigned" }),
        asg({ _id: "a2", homeId: "h1", registrationId: "r2", night: "2026-11-20", status: "assigned" }),
      ],
      registrations: [],
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });
    assert.equal(report.homes[0]?.fridayFree, -1);
  });
});

describe("buildLodgingPendingReport", () => {
  it("lista sin cama, por confirmar y sin confirmar; omite quien no requiere o ya está confirmado", () => {
    const homes = [home({ _id: "h1", name: "Casa Alfa" })];
    const registrations = [
      reg({ _id: "r-zone10", fullName: "Zoe", zoneId: "zona-10", churchName: "IPN NORTE", lodgingNeed: "requested" }),
      reg({ _id: "r-none", fullName: "No necesita", lodgingNeed: "none" }),
      reg({ _id: "r-ask", fullName: "Pedro Solicita", lodgingNeed: "requested" }),
      reg({ _id: "r-unknown", fullName: "Ana Duda", lodgingNeed: "unknown" }),
      reg({ _id: "r-soft", fullName: "Luis Asignado", lodgingNeed: "requested" }),
      reg({ _id: "r-ok", fullName: "Confirmado", lodgingNeed: "requested" }),
      reg({ _id: "r-cancel", fullName: "Cancelado", lodgingNeed: "requested" }),
    ];
    const assignments = [
      asg({ _id: "a-soft", homeId: "h1", registrationId: "r-soft", night: "2026-11-21", status: "assigned" }),
      asg({ _id: "a-ok", homeId: "h1", registrationId: "r-ok", night: "2026-11-20", status: "confirmed" }),
      asg({ _id: "a-cancel", homeId: "h1", registrationId: "r-cancel", night: "2026-11-20", status: "cancelled" }),
    ];

    const report = buildLodgingPendingReport({
      homes,
      assignments,
      registrations,
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });

    assert.deepEqual(
      report.people.map((person) => person.fullName),
      ["Hno Ana Duda", "Hno Cancelado", "Hno Luis Asignado", "Hno Pedro Solicita", "Hno Zoe"]
    );
    const byName = new Map(report.people.map((person) => [person.fullName, person]));
    assert.equal(byName.get("Hno Pedro Solicita")?.statusLabel, "Sin asignar");
    assert.equal(byName.get("Hno Pedro Solicita")?.detail, "Pidió cama y aún no tiene hogar");
    assert.equal(byName.get("Hno Ana Duda")?.statusLabel, "Por confirmar");
    assert.equal(byName.get("Hno Luis Asignado")?.detail, "Asignado, falta confirmar · Casa Alfa · Sábado 21");
    assert.equal(byName.get("Hno Cancelado")?.statusLabel, "Sin asignar");
    assert.equal(byName.get("Hno Zoe")?.churchZoneLabel, "IPN NORTE · Zona 10");
  });
});
