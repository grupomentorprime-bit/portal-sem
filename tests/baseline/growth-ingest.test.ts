/**
 * OT-GROWTH-CORE-005 — Ingestión en vivo (proyección idempotente).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildGrowthIngestKey,
  createMemoryGrowthEventBus,
  createMemoryGrowthIngestStores,
  createMemoryGrowthOpportunityWorkflow,
  projectGrowthFromSignal,
  projectGrowthFromSignalSafe,
  upsertGrowthPersona,
} from "../../src/core/growth";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-CORE-005 — cableado fuente → Growth", () => {
  it("admisión proyecta después de persistir; handoff adapter intacto", () => {
    const interesado = readSrc("src/core/admission/interesado-repository.ts");
    assert.match(interesado, /ingestInteresadoToGrowthSafe/);
    assert.match(interesado, /insertOne/);
    const ingestIdx = interesado.lastIndexOf("ingestInteresadoToGrowthSafe");
    const insertIdx = interesado.indexOf("await db.collection(COLLECTION).insertOne");
    assert.ok(insertIdx >= 0 && ingestIdx > insertIdx);
    assert.match(interesado, /adapter\.handoff/);
    assert.match(interesado, /getAdmissionAdapter/);

    const adapter = readSrc("src/core/admission/admission-adapter.ts");
    assert.equal(adapter.includes("growth_"), false);
    assert.equal(adapter.includes("projectGrowth"), false);
  });

  it("forms: save antes de processFormDestination; solo destinos V1", () => {
    const engine = readSrc("src/core/experience/forms/engine.ts");
    const saveIdx = engine.indexOf("await store.save");
    const destIdx = engine.indexOf("processFormDestination");
    // última llamada a processFormDestination en submitExperienceForm
    const submitDestIdx = engine.lastIndexOf("processFormDestination");
    assert.ok(saveIdx >= 0 && submitDestIdx > saveIdx);
    assert.match(engine, /isGrowthV1FormDestination/);
    assert.match(engine, /ingestFormSubmissionToGrowthSafe/);
    assert.match(engine, /attendance_confirmation/);
    assert.equal(destIdx >= 0, true);
  });
});

describe("OT-GROWTH-CORE-005 — proyección", () => {
  it("admisión → Persona + conversion + application_received; handoff → handed_off", async () => {
    const { personas, oportunidades, activities } =
      createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();

    const r = await projectGrowthFromSignal(
      { personas, oportunidades, workflow: wf, eventBus: bus },
      {
        kind: "admission",
        tenantId: "t1",
        interesadoId: "int-1",
        firstName: "Ana",
        lastName: "Pérez",
        email: "ana@ex.com",
        phone: "+56 9 1111 2222",
        programId: "prog-a",
        programLabel: "Programa A",
        capturedAt: "2026-09-05T10:00:00.000Z",
        handoff: {
          delivered: true,
          externalId: "ah-1",
          adapter: "local",
        },
      }
    );

    assert.equal(r.ok, true);
    if (!r.ok || r.outcome !== "projected") return;
    assert.equal(r.persona.emailNormalized, "ana@ex.com");
    assert.equal(r.oportunidad.typeKey, "conversion");
    assert.equal(r.oportunidad.subjectType, "program");
    assert.equal(r.oportunidad.subjectId, "prog-a");
    assert.equal(r.oportunidad.status, "handed_off");
    assert.equal(r.oportunidad.handoff?.interesadoId, "int-1");
    assert.equal(r.primaryActivity.kind, "application_received");
    assert.equal(
      r.primaryActivity.ingestKey,
      buildGrowthIngestKey("portal_interesados", "int-1", "application_received")
    );
    assert.ok(
      bus.events.some((e) => e.type === "GrowthPersonaUpserted"),
      "GrowthPersonaUpserted"
    );
    assert.ok(activities.size >= 3);
  });

  it("reintento no duplica Persona / Oportunidad / Actividad primaria", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const input = {
      kind: "admission" as const,
      tenantId: "t1",
      interesadoId: "int-retry",
      firstName: "Luis",
      lastName: "Rojas",
      email: "luis@ex.com",
      phone: "+56 9 3333 4444",
      programId: "prog-b",
      capturedAt: "2026-09-05T11:00:00.000Z",
      handoff: { delivered: true, externalId: "ah-2", adapter: "local" },
    };

    const first = await projectGrowthFromSignal(deps, input);
    assert.equal(first.ok, true);
    if (!first.ok || (first.outcome !== "projected" && first.outcome !== "idempotent_hit"))
      return;

    const personasBefore = stores.personas.personas.size;
    const oppBefore = stores.oportunidades.oportunidades.size;
    const actBefore = stores.activities.size;

    const second = await projectGrowthFromSignal(deps, input);
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.outcome, "idempotent_hit");
    assert.equal(stores.personas.personas.size, personasBefore);
    assert.equal(stores.oportunidades.oportunidades.size, oppBefore);
    assert.equal(stores.activities.size, actBefore);
    if (second.outcome === "idempotent_hit") {
      assert.equal(second.persona._id, first.ok && "persona" in first ? first.persona._id : "");
      assert.equal(
        second.oportunidad._id,
        first.ok && "oportunidad" in first ? first.oportunidad._id : ""
      );
    }
  });

  it("mismo contacto por dos fuentes → una Persona, dos Oportunidades", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const a = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "t1",
      submissionId: "sub-1",
      formId: "information-request",
      destination: "information_request",
      data: {
        fullName: "Camila Soto",
        email: "camila@ex.com",
        phone: "+56 9 5555 6666",
      },
      capturedAt: "2026-09-05T12:00:00.000Z",
    });
    assert.equal(a.ok, true);
    if (!a.ok || a.outcome !== "projected") return;
    assert.equal(a.oportunidad.typeKey, "inquiry");

    const b = await projectGrowthFromSignal(deps, {
      kind: "admission",
      tenantId: "t1",
      interesadoId: "int-camila",
      firstName: "Camila",
      lastName: "Soto",
      email: "camila@ex.com",
      phone: "+56 9 5555 6666",
      programId: "prog-c",
      capturedAt: "2026-09-05T12:05:00.000Z",
      handoff: { delivered: false },
    });
    assert.equal(b.ok, true);
    if (!b.ok || b.outcome !== "projected") return;
    assert.equal(b.persona._id, a.persona._id);
    assert.equal(b.oportunidad.typeKey, "conversion");
    assert.notEqual(b.oportunidad._id, a.oportunidad._id);
    assert.equal(stores.personas.personas.size, 1);
    assert.equal(stores.oportunidades.oportunidades.size, 2);
  });

  it("tenants aislados: mismo email en otro Espacio es otra Persona", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const t1 = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "tenant-a",
      submissionId: "s-a",
      formId: "contact",
      destination: "contact",
      data: { email: "shared@ex.com", fullName: "A" },
    });
    const t2 = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "tenant-b",
      submissionId: "s-b",
      formId: "contact",
      destination: "contact",
      data: { email: "shared@ex.com", fullName: "B" },
    });
    assert.equal(t1.ok && t1.outcome === "projected", true);
    assert.equal(t2.ok && t2.outcome === "projected", true);
    if (
      !t1.ok ||
      t1.outcome !== "projected" ||
      !t2.ok ||
      t2.outcome !== "projected"
    )
      return;
    assert.notEqual(t1.persona._id, t2.persona._id);
    assert.equal(stores.personas.personas.size, 2);
  });

  it("identity_conflict conserva proyección parcial: registra conflicto, sin Oportunidad nueva", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    await upsertGrowthPersona(stores.personas, {
      tenantId: "t1",
      email: "a@ex.com",
      origin: {
        kind: "manual",
        sourceCollection: "seed",
        sourceId: "p-email",
      },
      now: "2026-09-05T09:00:00.000Z",
    });
    await upsertGrowthPersona(stores.personas, {
      tenantId: "t1",
      phone: "+56 9 7777 8888",
      origin: {
        kind: "manual",
        sourceCollection: "seed",
        sourceId: "p-phone",
      },
      now: "2026-09-05T09:01:00.000Z",
    });

    const oppBefore = stores.oportunidades.oportunidades.size;
    const conflict = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "t1",
      submissionId: "sub-conflict",
      formId: "contact",
      destination: "contact",
      data: {
        email: "a@ex.com",
        phone: "+56 9 7777 8888",
        fullName: "Conflicto",
      },
    });

    assert.equal(conflict.ok, true);
    if (!conflict.ok) return;
    assert.equal(conflict.outcome, "identity_conflict");
    assert.equal(stores.oportunidades.oportunidades.size, oppBefore);
    assert.ok(
      [...stores.activities.values()].some((a) => a.kind === "identity_conflict")
    );
  });

  it("fallo de proyección no rompe: Safe traga errores", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const brokenPersonas = {
      ...stores.personas,
      async findByEmail() {
        throw new Error("simulated persona store failure");
      },
    };

    const safe = await projectGrowthFromSignalSafe(
      {
        personas: brokenPersonas,
        oportunidades: stores.oportunidades,
        workflow: wf,
      },
      {
        kind: "admission",
        tenantId: "t1",
        interesadoId: "int-fail",
        firstName: "X",
        lastName: "Y",
        email: "fail@ex.com",
        phone: "+56 9 0000 1111",
        programId: "p",
      }
    );
    assert.equal(safe.ok, false);
    if (safe.ok) return;
    assert.equal(safe.reason, "projection_error");
  });

  it("event_registration → registration; destinos fuera de V1 se omiten", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const reg = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "t1",
      submissionId: "sub-evt",
      formId: "evento-1",
      destination: "event_registration",
      data: { email: "evt@ex.com", fullName: "Evento" },
    });
    assert.equal(reg.ok && reg.outcome === "projected", true);
    if (!reg.ok || reg.outcome !== "projected") return;
    assert.equal(reg.oportunidad.typeKey, "registration");
    assert.equal(reg.oportunidad.origin.kind, "event");

    const skip = await projectGrowthFromSignal(deps, {
      kind: "form",
      tenantId: "t1",
      submissionId: "sub-att",
      formId: "jornada",
      destination: "attendance_confirmation",
      data: { email: "att@ex.com" },
    });
    assert.equal(skip.ok && skip.outcome === "skipped", true);
    if (!skip.ok || skip.outcome !== "skipped") return;
    assert.equal(skip.reason, "destination_out_of_scope");
  });

  it("live-ingest y workflow de producción existen; branding /platform no tocado", () => {
    assert.equal(
      existsSync(resolve(process.cwd(), "src/lib/growth/live-ingest.ts")),
      true
    );
    assert.equal(
      existsSync(
        resolve(process.cwd(), "src/lib/growth/opportunity-workflow.ts")
      ),
      true
    );
    const platform = readSrc("src/app/platform/page.tsx");
    // No exigimos cambios; solo que el archivo siga existiendo (deuda branding ajena).
    assert.ok(platform.length > 0);
  });
});
