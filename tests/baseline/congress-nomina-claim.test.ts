import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyCongressFormClaim,
  isCongressRegistrationClaimable,
  searchClaimableCongressRegistrations,
  shouldCreateFormRegistrationFromSubmission,
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

  it("aplica claim sobre stub import", () => {
    const base = stub({ _id: "1", fullName: "Hno David Orellana" });
    const result = applyCongressFormClaim({
      registration: base,
      submissionId: "sub-1",
      fullName: "David Orellana",
      rut: "12.345.678-5",
      email: "a@b.cl",
      phone: "+56911111111",
      zoneId: "zona-1",
      churchName: "Quilicura Centro",
      expectedDays: { saturday: true, sunday: false },
      nowIso: "2026-11-18T12:00:00.000Z",
      conflictingRutRegistrationId: null,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.registration.submissionId, "sub-1");
    assert.equal(result.registration.identity.fullName, "David Orellana");
    assert.equal(result.registration.churchName, "Quilicura Centro");
    assert.equal(result.registration.expectedDays?.sunday, false);
    assert.equal(result.registration.identity.status, "verified");
    assert.equal(result.registration.needsReview, false);
  });

  it("sync no crea source=form cuando hay registrationId", () => {
    assert.equal(shouldCreateFormRegistrationFromSubmission({ registrationId: "creg_1" }), false);
    assert.equal(shouldCreateFormRegistrationFromSubmission({}), true);
  });

  it("rechaza claim si ya tiene submissionId", () => {
    const base = stub({ _id: "1", fullName: "X", submissionId: "sub-0" });
    const result = applyCongressFormClaim({
      registration: base,
      submissionId: "sub-1",
      fullName: "X",
      rut: null,
      email: null,
      phone: null,
      zoneId: "zona-1",
      churchName: "Q",
      expectedDays: { saturday: null, sunday: null },
      nowIso: "2026-11-18T12:00:00.000Z",
      conflictingRutRegistrationId: null,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, "not_claimable");
  });
});
