import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasCongressFormEnrollment,
  searchEnrolledCongressRegistrations,
} from "../../src/core/congress/claim";
import { applyOperatorIdentityEdit } from "../../src/core/congress/registration-edit";
import type { CongressRegistration } from "../../src/core/congress/types";

function stub(
  partial: Partial<CongressRegistration> & { _id: string; fullName: string }
): CongressRegistration {
  const { fullName, identity, ...rest } = partial;
  return {
    tenantId: "t1",
    eventId: "ipn-congreso-varones-2026",
    source: "import",
    submissionId: null,
    importRowId: null,
    zoneId: "zona-7",
    churchName: "IPN SAN CARLOS",
    expectedDays: { saturday: true, sunday: true },
    lodgingNeed: "unknown",
    attendance: { saturday: null, sunday: null },
    chargeAmountClp: 17000,
    allocatedPaidClp: 0,
    needsReview: true,
    version: 1,
    createdAt: "2026-11-17T00:00:00.000Z",
    updatedAt: "2026-11-17T00:00:00.000Z",
    ...rest,
    _id: partial._id,
    identity: {
      fullName,
      rut: identity?.rut ?? null,
      email: identity?.email ?? null,
      phone: identity?.phone ?? null,
      status: identity?.status ?? "provisional",
    },
  };
}

describe("operator identity edit", () => {
  it("reemplaza un RUT ya guardado y normaliza el nombre", () => {
    const current = stub({
      _id: "a",
      fullName: "Hno Eleuterio Espinoza",
      identity: {
        fullName: "Hno Eleuterio Espinoza",
        rut: "12.345.678-5",
        email: null,
        phone: null,
        status: "verified",
      },
    });
    const result = applyOperatorIdentityEdit({
      registration: current,
      fullName: "eleuterio espinoza",
      rut: "15.676.490-6",
      email: "Eleuterio@Iglesia.cl",
      phone: "+56 9 1111 2222",
      zoneId: "zona-7",
      churchName: "  IPN San Carlos  ",
      existing: [current],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.identity.fullName, "Hno eleuterio espinoza");
    assert.equal(result.identity.rut, "15.676.490-6");
    assert.equal(result.identity.email, "eleuterio@iglesia.cl");
    assert.equal(result.identity.phone, "+56 9 1111 2222");
    assert.equal(result.identity.status, "verified");
    assert.equal(result.churchName, "IPN San Carlos");
    assert.equal(result.needsReview, false);
  });

  it("rechaza un RUT que ya está en otra ficha", () => {
    const current = stub({ _id: "a", fullName: "Hno Eleuterio Espinoza" });
    const other = stub({
      _id: "b",
      fullName: "Hno Dulio Salinas",
      identity: {
        fullName: "Hno Dulio Salinas",
        rut: "8.795.496-K",
        email: null,
        phone: null,
        status: "verified",
      },
    });
    const result = applyOperatorIdentityEdit({
      registration: current,
      fullName: "Eleuterio Espinoza",
      rut: "8795496k",
      email: "",
      phone: "",
      zoneId: "zona-7",
      churchName: "IPN SAN CARLOS",
      existing: [current, other],
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "duplicate_rut");
    assert.equal(result.duplicateId, "b");
  });

  it("rechaza RUT inválido y deja vacío el RUT si se borra", () => {
    const current = stub({ _id: "a", fullName: "Hno Eleuterio Espinoza" });
    const invalid = applyOperatorIdentityEdit({
      registration: current,
      fullName: "Eleuterio Espinoza",
      rut: "1",
      email: "",
      phone: "",
      zoneId: "zona-7",
      churchName: "IPN SAN CARLOS",
      existing: [current],
    });
    assert.equal(invalid.ok, false);

    const cleared = applyOperatorIdentityEdit({
      registration: current,
      fullName: "Eleuterio Espinoza",
      rut: "",
      email: "",
      phone: "",
      zoneId: "zona-7",
      churchName: "IPN SAN CARLOS",
      existing: [current],
    });
    assert.equal(cleared.ok, true);
    if (!cleared.ok) return;
    assert.equal(cleared.identity.rut, null);
    assert.equal(cleared.identity.status, "provisional");
    assert.equal(cleared.needsReview, true);
  });

  it("normaliza el celular a +56 y rechaza uno incompleto", () => {
    const current = stub({ _id: "a", fullName: "Hno Eleuterio Espinoza" });
    const saved = applyOperatorIdentityEdit({
      registration: current,
      fullName: "Eleuterio Espinoza",
      rut: "",
      email: "",
      phone: "987654321",
      zoneId: "zona-7",
      churchName: "IPN SAN CARLOS",
      existing: [current],
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    assert.equal(saved.identity.phone, "+56 9 8765 4321");

    const invalid = applyOperatorIdentityEdit({
      registration: current,
      fullName: "Eleuterio Espinoza",
      rut: "",
      email: "",
      phone: "21212121",
      zoneId: "zona-7",
      churchName: "IPN SAN CARLOS",
      existing: [current],
    });
    assert.equal(invalid.ok, false);
    if (invalid.ok) return;
    assert.equal(invalid.error, "invalid_phone");
  });
});

describe("formulario ya enviado en la búsqueda", () => {
  it("marca OK a quien ya envió y no a la nómina sin envío", () => {
    const pending = stub({ _id: "pending", fullName: "Hno Eleuterio Espinoza" });
    const sent = stub({
      _id: "sent",
      fullName: "Hno Joaquín Sepúlveda",
      churchName: "IPN ÑUBLE ALTO",
      submissionId: "sub-1",
    });
    const created = stub({
      _id: "created",
      fullName: "Hno Hernán Sepúlveda",
      source: "form",
      submissionId: null,
    });

    assert.equal(hasCongressFormEnrollment(pending), false);
    assert.equal(hasCongressFormEnrollment(sent), true);
    assert.equal(hasCongressFormEnrollment(created), true);

    const joaquin = searchEnrolledCongressRegistrations(
      [pending, sent, created],
      "joaquin sepulveda"
    );
    assert.deepEqual(
      joaquin.matches.map((row) => row._id),
      ["sent"]
    );

    const family = searchEnrolledCongressRegistrations(
      [pending, sent, created],
      "sepulveda"
    );
    assert.deepEqual(
      family.matches.map((row) => row._id),
      ["sent", "created"]
    );
  });
});
