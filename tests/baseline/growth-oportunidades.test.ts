/**
 * OT-GROWTH-CORE-003 — Oportunidad + Workflow growth.opportunity + nextAction.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  clearGrowthNextAction,
  createMemoryGrowthOpportunityStore,
  createMemoryGrowthOpportunityWorkflow,
  createMemoryGrowthPersonaStore,
  ensureGrowthOpportunityIndexes,
  GROWTH_OPPORTUNITY_DEFINITION_KEY,
  GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE,
  handOffGrowthOpportunity,
  openGrowthOpportunity,
  setGrowthNextAction,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration014GrowthOportunidades } from "../../src/core/migrations/014-growth-oportunidades";
import { SYSTEM_WORKFLOW_TEMPLATES } from "../../src/core/workflow/definitions/defaults";

function loadEnvFile(filename: string): void {
  const envPath = resolve(process.cwd(), filename);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadTestMongoEnv(): void {
  loadEnvLocal();
  loadEnvFile(".env");
}

async function seedPersona(tenantId: string, email: string, sourceId: string) {
  const personas = createMemoryGrowthPersonaStore();
  const r = await upsertGrowthPersona(personas, {
    tenantId,
    email,
    origin: {
      kind: "manual",
      sourceCollection: "test",
      sourceId,
    },
    now: "2026-09-04T10:00:00.000Z",
  });
  assert.equal(r.ok, true);
  if (!r.ok) throw new Error("persona seed failed");
  return { personas, persona: r.persona };
}

describe("OT-GROWTH-CORE-003 — workflow template", () => {
  it("growth.opportunity está en SYSTEM_WORKFLOW_TEMPLATES (un solo motor)", () => {
    const found = SYSTEM_WORKFLOW_TEMPLATES.find(
      (t) => t.key === GROWTH_OPPORTUNITY_DEFINITION_KEY
    );
    assert.ok(found);
    assert.equal(found?.entityType, "growth.opportunity");
    assert.deepEqual(
      found?.states.map((s) => s.key),
      GROWTH_OPPORTUNITY_WORKFLOW_TEMPLATE.states.map((s) => s.key)
    );
    assert.equal(
      found?.states.some((s) => /matr[ií]cula|alumno|postul/i.test(s.key)),
      false
    );
  });
});

describe("OT-GROWTH-CORE-003 — oportunidades", () => {
  it("misma Persona puede tener varias Oportunidades", async () => {
    const { persona } = await seedPersona("t1", "multi@ex.com", "p1");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();

    const a = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "form",
        sourceCollection: "experience_form_submissions",
        sourceId: "sub-1",
      },
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-1",
      now: "2026-09-04T11:00:00.000Z",
    });
    const b = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "conversion",
      subjectType: "program",
      subjectId: "prog-1",
      origin: {
        kind: "admission",
        sourceCollection: "portal_interesados",
        sourceId: "int-1",
      },
      sourceCollection: "portal_interesados",
      sourceId: "int-1",
      now: "2026-09-04T11:01:00.000Z",
    });
    assert.equal(a.ok && b.ok, true);
    if (!a.ok || !b.ok) return;
    assert.equal(a.outcome, "created");
    assert.equal(b.outcome, "created");
    assert.notEqual(a.oportunidad._id, b.oportunidad._id);
    assert.equal(store.oportunidades.size, 2);
  });

  it("reusa abierta del mismo typeKey + asunto; abre otra si está cerrada", async () => {
    const { persona } = await seedPersona("t1", "reuse@ex.com", "p2");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();

    const first = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "form",
        sourceCollection: "forms",
        sourceId: "f1",
      },
      sourceCollection: "forms",
      sourceId: "f1",
      now: "2026-09-04T12:00:00.000Z",
    });
    assert.ok(first.ok);
    if (!first.ok) return;

    const reused = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "form",
        sourceCollection: "forms",
        sourceId: "f2",
      },
      sourceCollection: "forms",
      sourceId: "f2",
      now: "2026-09-04T12:01:00.000Z",
    });
    assert.ok(reused.ok);
    if (!reused.ok) return;
    assert.equal(reused.outcome, "reused");
    assert.equal(reused.oportunidad._id, first.oportunidad._id);

    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: first.oportunidad._id,
      transitionId: "activate",
      now: "2026-09-04T12:02:00.000Z",
    });
    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: first.oportunidad._id,
      transitionId: "lose",
      now: "2026-09-04T12:03:00.000Z",
    });

    const again = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "form",
        sourceCollection: "forms",
        sourceId: "f3",
      },
      sourceCollection: "forms",
      sourceId: "f3",
      now: "2026-09-04T12:04:00.000Z",
    });
    assert.ok(again.ok);
    if (!again.ok) return;
    assert.equal(again.outcome, "created");
    assert.notEqual(again.oportunidad._id, first.oportunidad._id);
  });

  it("tenants aislados", async () => {
    const a = await seedPersona("tenant-a", "same@ex.com", "pa");
    const b = await seedPersona("tenant-b", "same@ex.com", "pb");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();

    const oa = await openGrowthOpportunity(store, wf, {
      tenantId: "tenant-a",
      personaId: a.persona._id,
      typeKey: "registration",
      origin: {
        kind: "event",
        sourceCollection: "forms",
        sourceId: "ra",
      },
      sourceCollection: "forms",
      sourceId: "ra",
    });
    const ob = await openGrowthOpportunity(store, wf, {
      tenantId: "tenant-b",
      personaId: b.persona._id,
      typeKey: "registration",
      origin: {
        kind: "event",
        sourceCollection: "forms",
        sourceId: "rb",
      },
      sourceCollection: "forms",
      sourceId: "rb",
    });
    assert.ok(oa.ok && ob.ok);
    if (!oa.ok || !ob.ok) return;
    assert.notEqual(oa.oportunidad._id, ob.oportunidad._id);
    assert.equal(oa.oportunidad.tenantId, "tenant-a");
    assert.equal(ob.oportunidad.tenantId, "tenant-b");
    assert.equal(
      (await store.listByPersona("tenant-a", a.persona._id)).length,
      1
    );
    assert.equal(
      (await store.listByPersona("tenant-a", b.persona._id)).length,
      0
    );
  });

  it("transiciones inválidas rechazadas", async () => {
    const { persona } = await seedPersona("t1", "wf@ex.com", "pw");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "m1",
      },
      sourceCollection: "manual",
      sourceId: "m1",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    const bad = await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      toState: "won",
    });
    assert.equal(bad.ok, false);
    if (bad.ok) return;
    assert.equal(bad.reason, "invalid_transition");

    const still = await store.findById("t1", opened.oportunidad._id);
    assert.equal(still?.status, "open");
  });

  it("handed_off preserva historial y no borra Persona/Oportunidad", async () => {
    const { personas, persona } = await seedPersona("t1", "hand@ex.com", "ph");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "conversion",
      subjectType: "program",
      subjectId: "prog-x",
      origin: {
        kind: "admission",
        sourceCollection: "portal_interesados",
        sourceId: "int-h",
      },
      sourceCollection: "portal_interesados",
      sourceId: "int-h",
      now: "2026-09-04T13:00:00.000Z",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      transitionId: "activate",
      now: "2026-09-04T13:01:00.000Z",
    });

    const hand = await handOffGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      handoff: {
        interesadoId: "int-h",
        delivered: true,
        externalId: "ah-99",
        adapter: "aprende-hoy",
      },
      now: "2026-09-04T13:02:00.000Z",
    });
    assert.ok(hand.ok);
    if (!hand.ok) return;
    assert.equal(hand.oportunidad.status, "handed_off");
    assert.equal(hand.oportunidad.handoff?.delivered, true);
    assert.ok(hand.oportunidad.closedAt);
    assert.ok(await personas.findById("t1", persona._id));
    assert.ok(await store.findById("t1", opened.oportunidad._id));

    const transitions = [...store.activities.values()].filter(
      (a) => a.kind === "opportunity_transitioned"
    );
    assert.ok(transitions.length >= 2);

    const inst = wf.instances.get(hand.oportunidad.workflowInstanceId);
    assert.ok(inst);
    assert.ok(inst!.history.length >= 3);
  });

  it("nextAction se crea, actualiza y cierra sin motor externo", async () => {
    const { persona } = await seedPersona("t1", "next@ex.com", "pn");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "n1",
      },
      sourceCollection: "manual",
      sourceId: "n1",
    });
    assert.ok(opened.ok);
    if (!opened.ok) return;

    const set1 = await setGrowthNextAction(store, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      summary: "Llamar al interesado",
      dueAt: "2026-09-05T15:00:00.000Z",
      assigneeUserId: "user-1",
      kind: "contact",
      now: "2026-09-04T14:00:00.000Z",
    });
    assert.ok(set1.ok);
    if (!set1.ok) return;
    assert.equal(set1.nextAction?.summary, "Llamar al interesado");
    assert.equal(set1.nextAction?.assigneeUserId, "user-1");

    const set2 = await setGrowthNextAction(store, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      summary: "Revisar respuesta",
      kind: "review",
      now: "2026-09-04T14:30:00.000Z",
    });
    assert.ok(set2.ok);
    if (!set2.ok) return;
    assert.equal(set2.nextAction?.summary, "Revisar respuesta");
    assert.equal(set2.nextAction?.assigneeUserId, undefined);

    const cleared = await clearGrowthNextAction(store, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      now: "2026-09-04T15:00:00.000Z",
    });
    assert.ok(cleared.ok);
    if (!cleared.ok) return;
    assert.equal(cleared.nextAction, null);
    assert.equal(cleared.oportunidad.nextAction, null);

    const nextActs = [...store.activities.values()].filter(
      (a) => a.kind === "next_action_set"
    );
    assert.equal(nextActs.length, 3);
  });

  it("tipos base inquiry/registration/conversion; rechaza desconocido", async () => {
    const { persona } = await seedPersona("t1", "types@ex.com", "pt");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();

    for (const typeKey of ["inquiry", "registration", "conversion"] as const) {
      const r = await openGrowthOpportunity(store, wf, {
        tenantId: "t1",
        personaId: persona._id,
        typeKey,
        subjectType: typeKey === "conversion" ? "program" : "none",
        subjectId: typeKey === "conversion" ? "p1" : undefined,
        origin: {
          kind: "manual",
          sourceCollection: "manual",
          sourceId: typeKey,
        },
        sourceCollection: "manual",
        sourceId: typeKey,
      });
      assert.equal(r.ok, true, typeKey);
    }

    const bad = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "matricula",
      origin: {
        kind: "manual",
        sourceCollection: "manual",
        sourceId: "bad",
      },
      sourceCollection: "manual",
      sourceId: "bad",
    });
    assert.equal(bad.ok, false);
    if (bad.ok) return;
    assert.equal(bad.reason, "invalid_type_key");
  });

  it("sin impacto en adapter / sin dual-write directo en open/transition", () => {
    const openSrc = readFileSync(
      resolve(process.cwd(), "src/core/growth/open-opportunity.ts"),
      "utf8"
    );
    const transitionSrc = readFileSync(
      resolve(process.cwd(), "src/core/growth/transition-opportunity.ts"),
      "utf8"
    );
    for (const src of [openSrc, transitionSrc]) {
      assert.equal(src.includes("createInteresado"), false);
      assert.equal(src.includes("processFormDestination"), false);
      assert.equal(src.includes("AdmissionAdapter"), false);
    }
    const interesado = readFileSync(
      resolve(process.cwd(), "src/core/admission/interesado-repository.ts"),
      "utf8"
    );
    // CORE-005: proyección vía ingestInteresadoToGrowthSafe, no open directo
    assert.equal(interesado.includes("growth_oportunidades"), false);
    assert.equal(interesado.includes("openGrowthOpportunity"), false);
    assert.match(interesado, /ingestInteresadoToGrowthSafe/);
  });
});

describe("OT-GROWTH-CORE-003 — índices", () => {
  it("migración 014 registrada", () => {
    const registry = readFileSync(
      resolve(process.cwd(), "src/core/migrations/registry.ts"),
      "utf8"
    );
    assert.match(registry, /migration014GrowthOportunidades/);
    assert.equal(migration014GrowthOportunidades.id, "014-growth-oportunidades");
  });

  it("ensureGrowthOpportunityIndexes idempotente (si hay Mongo)", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
      return;
    }
    const client = new MongoClient(uri);
    await client.connect();
    try {
      const db = client.db(dbName);
      const first = await ensureGrowthOpportunityIndexes(db);
      const second = await ensureGrowthOpportunityIndexes(db);
      assert.ok(first.results.length >= 4);
      assert.equal(second.results.length, first.results.length);
      for (const r of second.results) {
        assert.ok(r.result === "created" || r.result === "exists");
      }
    } finally {
      await client.close();
    }
  });
});
