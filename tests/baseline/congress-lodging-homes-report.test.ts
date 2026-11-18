import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLodgingHomesReport,
  labelLodgingNights,
} from "../../src/core/congress/lodging-homes-report";
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
    Pick<
      CongressLodgingAssignment,
      "_id" | "homeId" | "registrationId" | "night" | "status"
    >
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

describe("labelLodgingNights", () => {
  it("etiqueta vie, sáb y ambos", () => {
    assert.equal(labelLodgingNights(["2026-11-20"]), "Viernes 20");
    assert.equal(labelLodgingNights(["2026-11-21"]), "Sábado 21");
    assert.equal(
      labelLodgingNights(["2026-11-20", "2026-11-21"]),
      "Ambos (vie 20 y sáb 21)"
    );
  });
});

describe("buildLodgingHomesReport", () => {
  it("agrupa por hogar, numera por nombre, fusiona noches y excluye canceladas/vacíos", () => {
    const homes = [
      home({
        _id: "h-b",
        name: "Casa Beta",
        contactName: "Juan Beta",
        contactPhone: "+56 9 2222 2222",
        address: "Calle 2",
      }),
      home({
        _id: "h-a",
        name: "Casa Alfa",
        contactName: "Pedro Alfa",
        contactPhone: "+56 9 1111 1111",
        notes: "Sin 2° piso",
      }),
      home({ _id: "h-empty", name: "Casa Vacía", contactName: "Nadie" }),
    ];
    const r2 = reg({ _id: "r2", fullName: "Bruno Díaz" });
    const registrations = [
      reg({ _id: "r1", fullName: "Ana Pérez" }),
      { ...r2, identity: { ...r2.identity, phone: null } },
      reg({ _id: "r3", fullName: "Cancelado" }),
    ];
    const assignments = [
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
        registrationId: "r1",
        night: "2026-11-21",
        status: "confirmed",
      }),
      asg({
        _id: "a3",
        homeId: "h-b",
        registrationId: "r2",
        night: "2026-11-21",
        status: "assigned",
      }),
      asg({
        _id: "a4",
        homeId: "h-a",
        registrationId: "r3",
        night: "2026-11-20",
        status: "cancelled",
      }),
    ];

    const report = buildLodgingHomesReport({
      homes,
      assignments,
      registrations,
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });

    assert.equal(report.homes.length, 2);
    assert.equal(report.homes[0]?.homeNumber, 1);
    assert.equal(report.homes[0]?.name, "Casa Alfa");
    assert.equal(report.homes[0]?.hostName, "Pedro Alfa");
    assert.equal(report.homes[0]?.hostPhone, "+56 9 1111 1111");
    assert.equal(report.homes[0]?.notes, "Sin 2° piso");
    assert.equal(report.homes[0]?.guests.length, 1);
    assert.equal(report.homes[0]?.guests[0]?.fullName, "Hno Ana Pérez");
    assert.equal(report.homes[0]?.guests[0]?.phone, "+56911111111");
    assert.equal(report.homes[0]?.guests[0]?.nightsLabel, "Ambos (vie 20 y sáb 21)");
    assert.equal(report.homes[0]?.guestCount, 1);
    assert.equal(report.homes[0]?.bedsFriday, 1);
    assert.equal(report.homes[0]?.bedsSaturday, 1);

    assert.equal(report.homes[1]?.homeNumber, 2);
    assert.equal(report.homes[1]?.name, "Casa Beta");
    assert.equal(report.homes[1]?.hostPhone, "+56 9 2222 2222");
    assert.equal(report.homes[1]?.guests[0]?.fullName, "Hno Bruno Díaz");
    assert.equal(report.homes[1]?.guests[0]?.phone, "—");
    assert.equal(report.homes[1]?.guests[0]?.nightsLabel, "Sábado 21");
    assert.equal(report.homes[1]?.bedsFriday, 0);
    assert.equal(report.homes[1]?.bedsSaturday, 1);
  });

  it("usa Sin registrar / — si faltan contactos de familia", () => {
    const report = buildLodgingHomesReport({
      homes: [home({ _id: "h1", name: "Hogar", contactName: null, contactPhone: null })],
      assignments: [
        asg({
          _id: "a1",
          homeId: "h1",
          registrationId: "r1",
          night: "2026-11-20",
          status: "assigned",
        }),
      ],
      registrations: [reg({ _id: "r1", fullName: "Solo" })],
      generatedAtIso: "2026-11-17T15:00:00.000Z",
    });
    assert.equal(report.homes[0]?.hostName, "Sin registrar");
    assert.equal(report.homes[0]?.hostPhone, "—");
  });
});
