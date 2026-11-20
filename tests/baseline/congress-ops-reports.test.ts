import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONGRESS_ZONES } from "../../src/core/congress/constants";
import { buildOpsReport } from "../../src/core/congress/ops-reports";
import type { CongressPayment, CongressRegistration } from "../../src/core/congress/types";

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
    churchName: "La Vid",
    identity: {
      fullName,
      rut: null,
      email: null,
      phone: "+56911111111",
      status: "provisional",
    },
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17000,
    allocatedPaidClp: 0,
    needsReview: false,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...rest,
  };
}

function payment(
  partial: Partial<CongressPayment> & Pick<CongressPayment, "_id" | "amountClp">
): CongressPayment {
  return {
    tenantId: "t",
    eventId: "e",
    payerType: "individual",
    payerName: "Juan Pérez",
    method: "cash",
    paidOn: "2026-11-18",
    folio: "CV-2026-00001",
    allocations: [],
    unallocatedClp: 0,
    status: "posted",
    createdByUserId: "u",
    createdAt: "2026-11-18T15:00:00.000Z",
    ...partial,
  };
}

const at = "2026-11-18T18:00:00.000Z";

describe("reportes operativos del congreso", () => {
  it("arma la nómina con las once zonas, en orden, fusionando la misma iglesia", () => {
    const report = buildOpsReport("roster", {
      generatedAtIso: at,
      payments: [],
      registrations: [
        reg({ _id: "a", fullName: "Pedro Soto", zoneId: "zona-11", churchName: "IPN Betel" }),
        reg({ _id: "b", fullName: "Ana Díaz", zoneId: "zona-2", churchName: "La Vid" }),
        reg({
          _id: "c",
          fullName: "Luis Mora",
          zoneId: "zona-2",
          churchName: "IPN LA VID",
          isChurchGroupLeader: true,
        }),
      ],
    });
    assert.equal(report.kind, "roster");
    if (report.kind !== "roster") return;
    assert.deepEqual(
      report.zones.map((z) => z.zoneId),
      CONGRESS_ZONES.map((z) => z.id)
    );
    assert.equal(report.total, 3);
    const zona2 = report.zones[1];
    assert.equal(zona2.churches.length, 1);
    assert.equal(zona2.churches[0].label, "IPN LA VID");
    assert.deepEqual(
      zona2.churches[0].people.map((p) => p.name),
      ["Ana Díaz", "Luis Mora"]
    );
    assert.equal(zona2.churches[0].leaders[0]?.name, "Luis Mora");
    assert.equal(report.zones[0].churches.length, 0);
  });

  it("lista el jefe de cada zona y los miembros bajo su líder de iglesia", () => {
    const registrations = [
      reg({
        _id: "chief",
        fullName: "Mario Ruiz",
        zoneId: "zona-3",
        churchName: "Centro",
        isZoneLeader: true,
        isChurchGroupLeader: true,
      }),
      reg({ _id: "m1", fullName: "Bruno Gil", zoneId: "zona-3", churchName: "Centro" }),
      reg({
        _id: "other",
        fullName: "Raúl Peña",
        zoneId: "zona-3",
        churchName: "Norte",
        isChurchGroupLeader: true,
      }),
    ];
    const leaders = buildOpsReport("zone-leaders", {
      generatedAtIso: at,
      payments: [],
      registrations,
      churchesByZone: { "zona-4": ["Sur"] },
    });
    assert.equal(leaders.kind, "zone-leaders");
    if (leaders.kind !== "zone-leaders") return;
    assert.equal(leaders.zones.length, 11);
    const zona3 = leaders.zones[2];
    assert.equal(zona3.zoneLeaders[0]?.name, "Mario Ruiz");
    assert.equal(zona3.memberCount, 3);
    const zona4 = leaders.zones[3];
    assert.equal(zona4.zoneLeaders.length, 0);
    assert.equal(zona4.churches[0]?.label, "IPN SUR");
    assert.equal(zona4.churches[0]?.memberCount, 0);

    const detail = buildOpsReport("church-leaders", {
      generatedAtIso: at,
      payments: [],
      registrations,
    });
    assert.equal(detail.kind, "church-leaders");
    if (detail.kind !== "church-leaders") return;
    const centro = detail.zones[2].churches.find((c) => c.label === "IPN CENTRO");
    assert.equal(centro?.leaders[0]?.name, "Mario Ruiz");
    assert.deepEqual(centro?.people.map((p) => p.name), ["Bruno Gil", "Mario Ruiz"]);
  });

  it("cuadra finanzas, deja fuera al pagado y no suma caja anulada", () => {
    const registrations = [
      reg({ _id: "paid", fullName: "Hugo Paz", allocatedPaidClp: 17000 }),
      reg({ _id: "part", fullName: "Ivo Lea", allocatedPaidClp: 5000 }),
      reg({ _id: "due", fullName: "Omar Sol", allocatedPaidClp: 0, zoneId: "zona-1", churchName: "Alfa" }),
    ];
    const payments = [
      payment({
        _id: "p1",
        amountClp: 22000,
        allocations: [
          { registrationId: "paid", amountClp: 17000 },
          { registrationId: "part", amountClp: 5000 },
        ],
      }),
      payment({
        _id: "p2",
        amountClp: 9000,
        status: "voided",
        folio: "CV-2026-00002",
        method: "transfer",
      }),
    ];
    const finance = buildOpsReport("finance", {
      generatedAtIso: at,
      registrations,
      payments,
    });
    assert.equal(finance.kind, "finance");
    if (finance.kind !== "finance") return;
    assert.equal(finance.close.expectedClp, 51000);
    assert.equal(finance.close.collectedClp, 22000);
    assert.equal(finance.close.remainingClp, 29000);
    assert.equal(finance.reconcile.deltaClp, 0);
    assert.equal(finance.zones[0].zoneLabel, "Zona 01");
    assert.equal(finance.zones[0].remainingClp, 17000);
    assert.equal(finance.zones[1].count, 2);
    assert.equal(finance.churches[0]?.churchLabel, "IPN ALFA");

    const debtors = buildOpsReport("debtors", {
      generatedAtIso: at,
      registrations,
      payments,
    });
    assert.equal(debtors.kind, "debtors");
    if (debtors.kind !== "debtors") return;
    assert.equal(debtors.people, 2);
    assert.equal(debtors.balanceClp, 29000);
    assert.deepEqual(
      debtors.zones[0].churches[0].people.map((p) => p.name),
      ["Omar Sol"]
    );
    const zona2 = debtors.zones.find((z) => z.zoneId === "zona-2");
    assert.equal(zona2?.people[0]?.name, "Ivo Lea");

    const cash = buildOpsReport("cash", {
      generatedAtIso: at,
      registrations,
      payments,
    });
    assert.equal(cash.kind, "cash");
    if (cash.kind !== "cash") return;
    assert.equal(cash.totalsClp.total, 22000);
    assert.equal(cash.totalsClp.cash, 22000);
    assert.equal(cash.posted.length, 1);
    assert.equal(cash.voided.length, 1);
    assert.equal(cash.voided[0]?.folio, "CV-2026-00002");
    assert.equal(cash.byDay[0]?.paidOn, "2026-11-18");
  });

  it("cuenta presentes por zona sin marcar a quien no ha llegado", () => {
    const report = buildOpsReport("attendance", {
      generatedAtIso: at,
      payments: [],
      registrations: [
        reg({
          _id: "in",
          fullName: "Teo Mar",
          attendance: { saturday: true, sunday: false },
        }),
        reg({ _id: "out", fullName: "Uri Navia" }),
      ],
    });
    assert.equal(report.kind, "attendance");
    if (report.kind !== "attendance") return;
    assert.equal(report.total, 2);
    assert.equal(report.saturdayPresent, 1);
    assert.equal(report.sundayPresent, 0);
    assert.equal(report.zones[1].churches[0].saturdayPresent, 1);
    assert.equal(report.zones[1].memberCount, 2);
  });
});
