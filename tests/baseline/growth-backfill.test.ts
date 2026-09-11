/**
 * OT-GROWTH-CORE-006 — Backfill histórico (mismo contrato que CORE-005).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryGrowthBackfillSource,
  createMemoryGrowthIngestStores,
  createMemoryGrowthOpportunityWorkflow,
  projectGrowthFromSignal,
  runGrowthBackfill,
  upsertGrowthPersona,
} from "../../src/core/growth";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-CORE-006 — contrato y cableado", () => {
  it("reutiliza projectGrowthFromSignal; no segundo camino de transformación", () => {
    const backfill = readSrc("src/core/growth/backfill.ts");
    assert.match(backfill, /projectGrowthFromSignalSafe/);
    assert.match(backfill, /toGrowthAdmissionInput/);
    assert.match(backfill, /toGrowthFormInput/);
    assert.equal(backfill.includes("upsertGrowthPersona("), false);
    assert.equal(backfill.includes("openGrowthOpportunity("), false);

    const map = readSrc("src/core/growth/ingest-map.ts");
    assert.match(map, /toGrowthAdmissionInput/);
    assert.match(map, /toGrowthFormInput/);

    const live = readSrc("src/lib/growth/live-ingest.ts");
    assert.match(live, /toGrowthAdmissionInput/);
    assert.match(live, /toGrowthFormInput/);
  });

  it("CLI y runner existen; no toca /platform", () => {
    assert.equal(
      existsSync(resolve(process.cwd(), "scripts/backfill-growth-core.ts")),
      true
    );
    assert.equal(
      existsSync(resolve(process.cwd(), "src/core/growth/backfill-mongo.ts")),
      true
    );
    assert.equal(
      existsSync(resolve(process.cwd(), "src/lib/growth/backfill.ts")),
      true
    );
    const platform = readSrc("src/app/platform/page.tsx");
    assert.ok(platform.length > 0);
    const pkg = readSrc("package.json");
    assert.match(pkg, /backfill:growth/);
  });
});

describe("OT-GROWTH-CORE-006 — backfill", () => {
  it("proyecta históricos V1 y reejecución no duplica", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };
    const reader = createMemoryGrowthBackfillSource({
      interesados: [
        {
          _id: "int-1",
          tenant: "t1",
          firstName: "Ana",
          lastName: "Pérez",
          email: "ana@ex.com",
          phone: "+56 9 1111 2222",
          programId: "prog-a",
          programLabel: "Programa A",
          createdAt: "2026-01-01T10:00:00.000Z",
          handoff: { delivered: true, externalId: "ah-1", adapter: "local" },
        },
      ],
      submissions: [
        {
          _id: "sub-1",
          tenant: "t1",
          formId: "contact",
          destination: "contact",
          data: {
            email: "bob@ex.com",
            phone: "+56 9 3333 4444",
            fullName: "Bob",
          },
          createdAt: "2026-01-02T10:00:00.000Z",
        },
        {
          _id: "sub-evt",
          tenant: "t1",
          formId: "evento",
          destination: "event_registration",
          data: { email: "evt@ex.com", fullName: "Evento" },
          createdAt: "2026-01-03T10:00:00.000Z",
        },
      ],
    });

    const first = await runGrowthBackfill(deps, reader, {
      tenantId: "t1",
      batchSize: 2,
    });
    assert.equal(first.processed, 3);
    assert.equal(first.created, 3);
    assert.equal(first.alreadyExisting, 0);
    assert.equal(first.errors, 0);
    assert.equal(stores.personas.personas.size, 3);
    assert.equal(stores.oportunidades.oportunidades.size, 3);

    const personasBefore = stores.personas.personas.size;
    const oppBefore = stores.oportunidades.oportunidades.size;
    const actBefore = stores.activities.size;

    const second = await runGrowthBackfill(deps, reader, {
      tenantId: "t1",
      batchSize: 2,
    });
    assert.equal(second.processed, 3);
    assert.equal(second.created, 0);
    assert.equal(second.alreadyExisting, 3);
    assert.equal(stores.personas.personas.size, personasBefore);
    assert.equal(stores.oportunidades.oportunidades.size, oppBefore);
    assert.equal(stores.activities.size, actBefore);
  });

  it("aisla Espacios: mismo email en otro tenant no cruza", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };
    const reader = createMemoryGrowthBackfillSource({
      submissions: [
        {
          _id: "s-a",
          tenant: "tenant-a",
          formId: "contact",
          destination: "contact",
          data: { email: "shared@ex.com", fullName: "A" },
        },
        {
          _id: "s-b",
          tenant: "tenant-b",
          formId: "contact",
          destination: "contact",
          data: { email: "shared@ex.com", fullName: "B" },
        },
      ],
    });

    const a = await runGrowthBackfill(deps, reader, { tenantId: "tenant-a" });
    const b = await runGrowthBackfill(deps, reader, { tenantId: "tenant-b" });
    assert.equal(a.created, 1);
    assert.equal(b.created, 1);
    assert.equal(stores.personas.personas.size, 2);
  });

  it("identity_conflict cuenta en resumen sin abortar el lote", async () => {
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

    const reader = createMemoryGrowthBackfillSource({
      submissions: [
        {
          _id: "sub-conflict",
          tenant: "t1",
          formId: "contact",
          destination: "contact",
          data: {
            email: "a@ex.com",
            phone: "+56 9 7777 8888",
            fullName: "Conflicto",
          },
        },
        {
          _id: "sub-ok",
          tenant: "t1",
          formId: "contact",
          destination: "contact",
          data: { email: "ok@ex.com", fullName: "OK" },
        },
      ],
    });

    const summary = await runGrowthBackfill(deps, reader, { tenantId: "t1" });
    assert.equal(summary.processed, 2);
    assert.equal(summary.conflicts, 1);
    assert.equal(summary.created, 1);
    assert.equal(summary.errors, 0);
  });

  it("registros fuera de V1 se omiten", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };
    const reader = createMemoryGrowthBackfillSource({
      submissions: [
        {
          _id: "sub-att",
          tenant: "t1",
          formId: "jornada",
          destination: "attendance_confirmation",
          data: { email: "att@ex.com" },
        },
        {
          _id: "sub-testimonial",
          tenant: "t1",
          formId: "testimonio",
          destination: "testimonial_submission",
          data: { email: "t@ex.com" },
        },
        {
          _id: "sub-inq",
          tenant: "t1",
          formId: "info",
          destination: "information_request",
          data: { email: "inq@ex.com", fullName: "Inq" },
        },
      ],
    });

    const summary = await runGrowthBackfill(deps, reader, { tenantId: "t1" });
    assert.equal(summary.processed, 3);
    assert.equal(summary.omitted, 2);
    assert.equal(summary.created, 1);
    assert.equal(stores.oportunidades.oportunidades.size, 1);
  });

  it("error parcial no aborta el backfill", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    let calls = 0;
    const personas = {
      ...stores.personas,
      async findByEmail(
        tenantId: string,
        emailNormalized: string
      ) {
        calls += 1;
        if (emailNormalized === "fail@ex.com") {
          throw new Error("simulated store failure");
        }
        return stores.personas.findByEmail(tenantId, emailNormalized);
      },
    };
    const deps = {
      personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };
    const reader = createMemoryGrowthBackfillSource({
      submissions: [
        {
          _id: "sub-fail",
          tenant: "t1",
          formId: "contact",
          destination: "contact",
          data: { email: "fail@ex.com", fullName: "Fail" },
        },
        {
          _id: "sub-ok",
          tenant: "t1",
          formId: "contact",
          destination: "contact",
          data: { email: "ok2@ex.com", fullName: "OK2" },
        },
      ],
    });

    const summary = await runGrowthBackfill(deps, reader, { tenantId: "t1" });
    assert.equal(summary.processed, 2);
    assert.equal(summary.errors, 1);
    assert.equal(summary.created, 1);
    assert.ok(calls >= 1);
  });

  it("compatible con datos ya creados por CORE-005 (idempotent_hit)", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };

    const live = await projectGrowthFromSignal(deps, {
      kind: "admission",
      tenantId: "t1",
      interesadoId: "int-live",
      firstName: "Live",
      lastName: "User",
      email: "live@ex.com",
      phone: "+56 9 9999 0000",
      programId: "prog-x",
      capturedAt: "2026-09-05T10:00:00.000Z",
      handoff: { delivered: false },
    });
    assert.equal(live.ok && live.outcome === "projected", true);

    const reader = createMemoryGrowthBackfillSource({
      interesados: [
        {
          _id: "int-live",
          tenant: "t1",
          firstName: "Live",
          lastName: "User",
          email: "live@ex.com",
          phone: "+56 9 9999 0000",
          programId: "prog-x",
          createdAt: "2026-09-05T10:00:00.000Z",
          handoff: { delivered: false },
        },
        {
          _id: "int-hist",
          tenant: "t1",
          firstName: "Hist",
          lastName: "User",
          email: "hist@ex.com",
          phone: "+56 9 8888 0000",
          programId: "prog-y",
          createdAt: "2025-01-01T10:00:00.000Z",
        },
      ],
    });

    const summary = await runGrowthBackfill(deps, reader, { tenantId: "t1" });
    assert.equal(summary.processed, 2);
    assert.equal(summary.alreadyExisting, 1);
    assert.equal(summary.created, 1);
    assert.equal(stores.personas.personas.size, 2);
  });

  it("pagina por lotes (batchSize)", async () => {
    const stores = createMemoryGrowthIngestStores();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const deps = {
      personas: stores.personas,
      oportunidades: stores.oportunidades,
      workflow: wf,
    };
    const submissions = Array.from({ length: 5 }, (_, i) => ({
      _id: `sub-${i}`,
      tenant: "t1",
      formId: "contact",
      destination: "contact" as const,
      data: { email: `u${i}@ex.com`, fullName: `U${i}` },
    }));
    const reader = createMemoryGrowthBackfillSource({ submissions });
    const summary = await runGrowthBackfill(deps, reader, {
      tenantId: "t1",
      batchSize: 2,
    });
    assert.equal(summary.processed, 5);
    assert.equal(summary.created, 5);
  });
});
