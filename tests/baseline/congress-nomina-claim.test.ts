import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyProtectedRegistrationChange,
  filePublicClaimRequest,
  isCongressRegistrationClaimable,
  issueAccreditedContactChallenge,
  nameOrRutMatchAuthorizesChange,
  registrationIdAuthorizesChange,
  searchClaimableCongressRegistrations,
  shouldCreateFormRegistrationFromSubmission,
  claimAuditMetadata,
} from "../../src/core/congress/claim";
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
    zoneId: "zona-1",
    churchName: "Quilicura",
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

describe("congress nomina claim search", () => {
  it("solo stubs import sin submissionId son reclamables", () => {
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "a", fullName: "Hno David Orellana", source: "import", submissionId: null })
      ),
      true
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({
          _id: "b",
          fullName: "Hno David Orellana",
          source: "import",
          submissionId: "sub1",
        })
      ),
      false
    );
    assert.equal(
      isCongressRegistrationClaimable(
        stub({ _id: "c", fullName: "Nuevo", source: "form", submissionId: null })
      ),
      false
    );
  });

  it("match directo ignora tildes y sugiere con typo", () => {
    const regs = [
      stub({
        _id: "1",
        fullName: "Hno Patricio Ravello",
        churchName: "Quilicura",
        zoneId: "zona-1",
      }),
      stub({
        _id: "2",
        fullName: "Hno Pedro González",
        churchName: "Quilicura",
        zoneId: "zona-1",
      }),
    ];
    const accent = searchClaimableCongressRegistrations(regs, "patricio ravello");
    assert.equal(accent.matches.length, 1);
    assert.equal(accent.matches[0]._id, "1");

    const typo = searchClaimableCongressRegistrations(regs, "patricio ravelo");
    const hitIds = [...typo.matches, ...typo.suggestions].map((r) => r._id);
    assert.ok(hitIds.includes("1"));
  });

  it("la solicitud pública no reescribe la ficha aunque coincidan nombre y RUT", () => {
    const base = stub({
      _id: "1",
      fullName: "Hno David Orellana",
      identity: {
        fullName: "Hno David Orellana",
        rut: "12.345.678-5",
        email: "ana@ejemplo.test",
        phone: "+56911111111",
        status: "provisional",
      },
    });
    assert.equal(registrationIdAuthorizesChange("1", "1"), false);
    assert.equal(nameOrRutMatchAuthorizesChange(true, true), false);
    const filed = filePublicClaimRequest({
      registration: base,
      submissionId: "sub-1",
      tenantId: "t1",
      opened: { ok: true, kind: "congress", tenantId: "t1", subjectId: "1" },
    });
    assert.equal(filed.ok, true);
    assert.equal(filed.registration.identity.fullName, "Hno David Orellana");
    assert.equal(filed.registration.identity.email, "ana@ejemplo.test");
    assert.equal(filed.registration.identity.status, "provisional");
    assert.equal(filed.registration.submissionId, null);
    assert.equal(filed.registration.version, 1);
  });

  it("un id de cliente sin referencia sellada no archiva la solicitud", () => {
    const base = stub({ _id: "1", fullName: "Hno David Orellana" });
    const filed = filePublicClaimRequest({
      registration: base,
      submissionId: "sub-1",
      tenantId: "t1",
      opened: { ok: false },
    });
    assert.equal(filed.ok, false);
    if (filed.ok) return;
    assert.equal(filed.error, "id_not_authority");
    assert.equal(filed.registration, base);
  });

  it("el operador con permiso aplica el cambio y no marca la identidad como verificada", () => {
    const base = stub({ _id: "1", fullName: "Hno David Orellana" });
    const result = applyProtectedRegistrationChange({
      registration: base,
      proposed: {
        submissionId: "sub-1",
        fullName: "David Orellana",
        rut: "12.345.678-5",
        email: "a@b.cl",
        phone: "+56911111111",
        zoneId: "zona-1",
        churchName: "Quilicura Centro",
        expectedDays: { saturday: true, sunday: false },
      },
      authorization: { method: "operator", permission: "congress.operate" },
      nowIso: "2026-11-18T12:00:00.000Z",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.registration.submissionId, "sub-1");
    assert.equal(result.registration.identity.fullName, "David Orellana");
    assert.equal(result.registration.identity.status, "provisional");
    assert.equal(result.registration.needsReview, true);
  });

  it("el contacto acreditado aplica el cambio; un token ajeno no", () => {
    const base = stub({
      _id: "1",
      fullName: "Ana Sintetica",
      identity: {
        fullName: "Ana Sintetica",
        rut: null,
        email: "ana.sintetica@ejemplo.test",
        phone: null,
        status: "provisional",
      },
    });
    const issued = issueAccreditedContactChallenge({
      registration: base,
      channel: "email",
      nowIso: "2026-11-18T12:00:00.000Z",
      ttlMs: 60_000,
      token: "token-sintetico",
    });
    assert.equal(issued.ok, true);
    if (!issued.ok) return;
    const denied = applyProtectedRegistrationChange({
      registration: base,
      proposed: {
        submissionId: "sub-1",
        fullName: "Ana Sintetica",
        rut: null,
        email: "otro@ejemplo.test",
        phone: null,
        zoneId: "zona-1",
        churchName: "Quilicura",
        expectedDays: { saturday: true, sunday: false },
      },
      authorization: {
        method: "accredited-contact",
        token: "otro-token",
        challenge: issued.challenge,
        nowIso: "2026-11-18T12:00:01.000Z",
      },
      nowIso: "2026-11-18T12:00:01.000Z",
    });
    assert.equal(denied.ok, false);
    assert.equal(base.identity.email, "ana.sintetica@ejemplo.test");
    const allowed = applyProtectedRegistrationChange({
      registration: base,
      proposed: {
        submissionId: "sub-1",
        fullName: "Ana Sintetica",
        rut: null,
        email: "ana.nueva@ejemplo.test",
        phone: null,
        zoneId: "zona-1",
        churchName: "Quilicura",
        expectedDays: { saturday: true, sunday: true },
      },
      authorization: {
        method: "accredited-contact",
        token: "token-sintetico",
        challenge: issued.challenge,
        nowIso: "2026-11-18T12:00:01.000Z",
      },
      nowIso: "2026-11-18T12:00:01.000Z",
    });
    assert.equal(allowed.ok, true);
    if (!allowed.ok) return;
    assert.equal(allowed.registration.identity.email, "ana.nueva@ejemplo.test");
    assert.equal(allowed.registration.identity.status, "provisional");
    const audit = JSON.stringify(
      claimAuditMetadata({
        phase: "applied",
        fields: ["email", "ana.nueva@ejemplo.test"],
        authorization: "accredited-contact",
        channel: "email",
      })
    );
    assert.equal(audit.includes("ana.nueva"), false);
    assert.equal(audit.includes("@"), false);
  });

  it("sync no crea source=form cuando hay registrationId", () => {
    assert.equal(shouldCreateFormRegistrationFromSubmission({ registrationId: "creg_1" }), false);
    assert.equal(shouldCreateFormRegistrationFromSubmission({}), true);
  });

  it("rechaza aplicar si la ficha ya tiene respuesta", () => {
    const base = stub({ _id: "1", fullName: "X", submissionId: "sub-0" });
    const result = applyProtectedRegistrationChange({
      registration: base,
      proposed: {
        submissionId: "sub-1",
        fullName: "X",
        rut: null,
        email: null,
        phone: null,
        zoneId: "zona-1",
        churchName: "Q",
        expectedDays: { saturday: null, sunday: null },
      },
      authorization: { method: "operator", permission: "congress.operate" },
      nowIso: "2026-11-18T12:00:00.000Z",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "not_claimable");
    assert.equal(base.submissionId, "sub-0");
  });
});
