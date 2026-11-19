import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  PUBLIC_ROSTER_MIN_QUERY,
  authorizeRosterContactChange,
  publicRosterHitExposesInternalId,
  publicRosterMatchFields,
  toPublicRosterHit,
} from "../../src/core/experience/public-roster";
import { matchesPersonSearch } from "../../src/lib/experience/forms/person-search";
import {
  PUBLIC_SEARCH_LIMIT,
  consumeDistributedRateLimit,
  consumeRateLimit,
  createCollectionRateLimitStore,
  createMemoryDistributedRateLimitStore,
  createMemoryRateLimitStore,
} from "../../src/core/security/public-rate-limit";
import { openSelectionRef, sealSelectionRef } from "../../src/core/security/selection-ref";
import { toPublicCongressRosterHit } from "../../src/core/congress/claim";

describe("nómina pública", () => {
  it("no expone id, correo ni teléfono", () => {
    const hit = toPublicRosterHit(
      {
        fullName: "Ana Sintetica",
        generation: "2024",
        email: "ana.sintetica@ejemplo.test",
        phone: "+56911111111",
      },
      "sel-1"
    );
    assert.equal(hit.hasEmail, true);
    assert.equal(hit.hasPhone, true);
    assert.equal(publicRosterHitExposesInternalId(hit), false);
    assert.equal(JSON.stringify(hit).includes("ana.sintetica"), false);
    assert.equal(JSON.stringify(hit).includes("569"), false);
  });

  it("el congreso público usa una referencia sellada, no el id", () => {
    const secret = "sintetico";
    const ref = sealSelectionRef(
      { kind: "congress", tenantId: "t1", subjectId: "creg-sintetica", exp: 9_000 },
      secret
    );
    const hit = toPublicCongressRosterHit(
      {
        _id: "creg-sintetica",
        tenantId: "t1",
        eventId: "evt",
        source: "import",
        submissionId: null,
        importRowId: null,
        zoneId: "zona-1",
        churchName: "Quilicura",
        expectedDays: { saturday: null, sunday: null },
        lodgingNeed: "unknown",
        attendance: { saturday: null, sunday: null },
        chargeAmountClp: 0,
        allocatedPaidClp: 0,
        needsReview: true,
        version: 1,
        createdAt: "2026-11-17T00:00:00.000Z",
        updatedAt: "2026-11-17T00:00:00.000Z",
        identity: {
          fullName: "Ana Sintetica",
          rut: null,
          email: null,
          phone: null,
          status: "provisional",
        },
      },
      ref
    );
    assert.equal("registrationId" in hit, false);
    assert.equal(hit.selectionRef.includes("creg-sintetica"), false);
    const opened = openSelectionRef(ref, secret, 1_000);
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.subject.subjectId, "creg-sintetica");
  });

  it("dos caracteres y un teléfono sintético no encuentran a la persona", () => {
    const student = {
      fullName: "Ana Sintetica",
      generation: "2024",
      email: "ana.sintetica@ejemplo.test",
      phone: "+56911111111",
      rut: "12.345.678-5",
    };
    assert.equal(foldLength("An") < PUBLIC_ROSTER_MIN_QUERY, true);
    assert.equal(matchesPersonSearch("+56911111111", publicRosterMatchFields(student)), false);
    assert.equal(matchesPersonSearch("12.345.678-5", publicRosterMatchFields(student)), false);
    assert.equal(matchesPersonSearch("Ana Sintetica", publicRosterMatchFields(student)), true);
  });

  it("studentId no autoriza cambiar el contacto", () => {
    assert.deepEqual(authorizeRosterContactChange({ method: "student-id" }), {
      ok: false,
      error: "identity_not_proven",
    });
    assert.deepEqual(authorizeRosterContactChange({ method: "name-or-rut" }), {
      ok: false,
      error: "identity_not_proven",
    });
    assert.equal(
      authorizeRosterContactChange({ method: "operator", permission: "student-affairs" }).ok,
      true
    );
  });

  it("la consulta 21 de la ventana responde límite", () => {
    const store = createMemoryRateLimitStore();
    for (let i = 0; i < PUBLIC_SEARCH_LIMIT; i += 1) {
      assert.equal(
        consumeRateLimit({
          store,
          key: "roster|sintetica",
          limit: PUBLIC_SEARCH_LIMIT,
          windowMs: 60_000,
          nowMs: 1_000 + i,
        }).ok,
        true
      );
    }
    const blocked = consumeRateLimit({
      store,
      key: "roster|sintetica",
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: 60_000,
      nowMs: 2_000,
    });
    assert.equal(blocked.ok, false);
    if (blocked.ok) return;
    assert.ok(blocked.retryAfterSec >= 1);
  });

  it("el formulario público ya no pide el id interno", () => {
    const form = readFileSync(
      "src/components/portal/experience/forms/ConvocatoriaParticipantFields.tsx",
      "utf8"
    );
    const congress = readFileSync(
      "src/components/portal/experience/forms/PortalCongressExperienceForm.tsx",
      "utf8"
    );
    const submit = readFileSync("src/app/api/experience/forms/[id]/submit/route.ts", "utf8");
    assert.match(form, /selectionRef/);
    assert.doesNotMatch(form, /student\.phone/);
    assert.doesNotMatch(form, /student\.email/);
    assert.match(congress, /selectionRef/);
    assert.doesNotMatch(submit, /updateRosterStudentContactFields/);
  });

  it("dos consumidores comparten el tope si usan el mismo almacén", async () => {
    const store = createMemoryDistributedRateLimitStore();
    for (let i = 0; i < PUBLIC_SEARCH_LIMIT; i += 1) {
      const first = await consumeDistributedRateLimit({
        store,
        key: "busqueda|sintetica",
        limit: PUBLIC_SEARCH_LIMIT,
        windowMs: 60_000,
        nowMs: 5_000,
      });
      assert.equal(first.ok, true);
    }
    const second = await consumeDistributedRateLimit({
      store,
      key: "busqueda|sintetica",
      limit: PUBLIC_SEARCH_LIMIT,
      windowMs: 60_000,
      nowMs: 5_500,
    });
    assert.equal(second.ok, false);
    const counts = new Map<string, number>();
    const collection = {
      async findOneAndUpdate(filter: { _id: string }) {
        const count = (counts.get(filter._id) ?? 0) + 1;
        counts.set(filter._id, count);
        return { count };
      },
    };
    const shared = createCollectionRateLimitStore(collection);
    const allowed = await consumeDistributedRateLimit({
      store: shared,
      key: "otro|sintetica",
      limit: 1,
      windowMs: 60_000,
      nowMs: 1_000,
    });
    const blocked = await consumeDistributedRateLimit({
      store: shared,
      key: "otro|sintetica",
      limit: 1,
      windowMs: 60_000,
      nowMs: 1_100,
    });
    assert.equal(allowed.ok, true);
    assert.equal(blocked.ok, false);
  });
});

function foldLength(value: string): number {
  return value.trim().length;
}
