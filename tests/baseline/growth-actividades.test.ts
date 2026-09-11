/**
 * OT-GROWTH-CORE-004 — Actividad append-only + Event Bus (core_events).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  DOMAIN_EVENT_TYPES,
  isKnownEventType,
} from "../../src/core/events/registry";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthOpportunityStore,
  createMemoryGrowthOpportunityWorkflow,
  createMemoryGrowthPersonaStore,
  ensureGrowthActivityIndexes,
  GROWTH_DOMAIN_EVENT_TYPES,
  growthEventTypeForActivityKind,
  handOffGrowthOpportunity,
  openGrowthOpportunity,
  recordGrowthActivity,
  transitionGrowthOpportunity,
  upsertGrowthPersona,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration015GrowthActividades } from "../../src/core/migrations/015-growth-actividades";
import { MIGRATIONS } from "../../src/core/migrations/registry";

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

describe("OT-GROWTH-CORE-004 — Event Bus types", () => {
  it("tipos Growth registrados en DOMAIN_EVENT_TYPES (un solo bus)", () => {
    for (const t of GROWTH_DOMAIN_EVENT_TYPES) {
      assert.equal(DOMAIN_EVENT_TYPES.includes(t), true, t);
      assert.equal(isKnownEventType(t), true, t);
    }
  });

  it("mapeo kind → evento estable", () => {
    assert.equal(
      growthEventTypeForActivityKind("opportunity_opened"),
      "GrowthOpportunityOpened"
    );
    assert.equal(
      growthEventTypeForActivityKind("opportunity_transitioned"),
      "GrowthOpportunityTransitioned"
    );
    assert.equal(
      growthEventTypeForActivityKind("next_action_set"),
      "GrowthNextActionSet"
    );
    assert.equal(
      growthEventTypeForActivityKind("handoff"),
      "GrowthHandoffRecorded"
    );
    assert.equal(
      growthEventTypeForActivityKind("identity_conflict"),
      "GrowthActivityRecorded"
    );
    assert.equal(
      growthEventTypeForActivityKind("note"),
      "GrowthActivityRecorded"
    );
  });
});

describe("OT-GROWTH-CORE-004 — actividades", () => {
  it("append-only: solo insert; mismo ingestKey no duplica", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const bus = createMemoryGrowthEventBus();

    const a1 = await recordGrowthActivity(
      store,
      {
        tenantId: "t1",
        personaId: "p1",
        kind: "note",
        summary: "Nota 1",
        ingestKey: "manual:n1:note",
        payload: { text: "hola" },
        occurredAt: "2026-09-04T12:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(a1.ok, true);
    if (!a1.ok) return;
    assert.equal(a1.published, true);
    assert.equal(a1.duplicated, false);
    assert.ok(a1.activity.eventId);

    const a2 = await recordGrowthActivity(
      store,
      {
        tenantId: "t1",
        personaId: "p1",
        kind: "note",
        summary: "Nota 1 bis",
        ingestKey: "manual:n1:note",
        occurredAt: "2026-09-04T12:01:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(a2.ok, true);
    if (!a2.ok) return;
    assert.equal(a2.duplicated, true);
    assert.equal(a2.activity._id, a1.activity._id);
    assert.equal(a2.activity.summary, "Nota 1");
    assert.equal(bus.events.length, 1);
    assert.equal(store.activities.size, 1);
  });

  it("aislamiento por tenant: mismo ingestKey en otro Espacio es otra Actividad", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const key = "src:1:note";

    const t1 = await recordGrowthActivity(store, {
      tenantId: "tenant-a",
      personaId: "p1",
      kind: "note",
      summary: "A",
      ingestKey: key,
    });
    const t2 = await recordGrowthActivity(store, {
      tenantId: "tenant-b",
      personaId: "p1",
      kind: "note",
      summary: "B",
      ingestKey: key,
    });
    assert.equal(t1.ok && t2.ok, true);
    if (!t1.ok || !t2.ok) return;
    assert.notEqual(t1.activity._id, t2.activity._id);
    assert.equal(store.activities.size, 2);
  });

  it("actividad puede existir sin Oportunidad", async () => {
    const store = createMemoryGrowthPersonaStore();
    const r = await recordGrowthActivity(store, {
      tenantId: "t1",
      personaId: "persona-only",
      kind: "form_submitted",
      summary: "Form enviado",
      ingestKey: "experience_form_submissions:sub-x:form_submitted",
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-x",
      payload: { formId: "f1" },
    });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.activity.oportunidadId, undefined);
    assert.equal(r.activity.kind, "form_submitted");
  });

  it("cambio de estado de Oportunidad genera Actividad", async () => {
    const { persona } = await seedPersona("t1", "act@ex.com", "seed-1");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();

    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "inquiry",
      origin: {
        kind: "form",
        sourceCollection: "experience_form_submissions",
        sourceId: "sub-op",
      },
      sourceCollection: "experience_form_submissions",
      sourceId: "sub-op",
      now: "2026-09-04T13:00:00.000Z",
      eventBus: bus,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;
    assert.equal(opened.activity?.kind, "opportunity_opened");
    assert.ok(opened.activity?.eventId);

    const tr = await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      transitionId: "activate",
      now: "2026-09-04T13:05:00.000Z",
      eventBus: bus,
    });
    assert.equal(tr.ok, true);
    if (!tr.ok) return;
    assert.equal(tr.activity.kind, "opportunity_transitioned");
    assert.equal(tr.toState, "active");
    assert.ok(tr.activity.eventId);
    assert.equal(
      bus.events.some((e) => e.type === "GrowthOpportunityTransitioned"),
      true
    );
  });

  it("handoff genera Actividad kind handoff (+ transitioned)", async () => {
    const { persona } = await seedPersona("t1", "hand@ex.com", "seed-h");
    const store = createMemoryGrowthOpportunityStore();
    const wf = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();

    const opened = await openGrowthOpportunity(store, wf, {
      tenantId: "t1",
      personaId: persona._id,
      typeKey: "conversion",
      origin: {
        kind: "admission",
        sourceCollection: "portal_interesados",
        sourceId: "int-1",
      },
      sourceCollection: "portal_interesados",
      sourceId: "int-1",
      subjectType: "program",
      subjectId: "prog-1",
      now: "2026-09-04T14:00:00.000Z",
      eventBus: bus,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) return;

    // open → active → handed_off (según template)
    await transitionGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      transitionId: "activate",
      now: "2026-09-04T14:01:00.000Z",
      eventBus: bus,
    });

    const ho = await handOffGrowthOpportunity(store, wf, {
      tenantId: "t1",
      oportunidadId: opened.oportunidad._id,
      handoff: {
        interesadoId: "int-1",
        delivered: true,
        externalId: "ah-99",
        adapter: "aprende-hoy",
      },
      now: "2026-09-04T14:02:00.000Z",
      eventBus: bus,
    });
    assert.equal(ho.ok, true);
    if (!ho.ok) return;
    assert.equal(ho.toState, "handed_off");
    assert.equal(ho.activity.kind, "opportunity_transitioned");
    assert.equal(ho.handoffActivity?.kind, "handoff");
    assert.ok(ho.handoffActivity?.eventId);
    assert.equal(
      bus.events.some((e) => e.type === "GrowthHandoffRecorded"),
      true
    );
    assert.equal(store.oportunidades.get(`t1::${opened.oportunidad._id}`)?.status, "handed_off");
  });

  it("fallo del Event Bus no borra Actividad; reintento completa eventId", async () => {
    const store = createMemoryGrowthOpportunityStore();
    const bus = createMemoryGrowthEventBus();
    bus.failNext = true;

    const first = await recordGrowthActivity(
      store,
      {
        tenantId: "t1",
        personaId: "p1",
        kind: "note",
        summary: "Persistida",
        ingestKey: "manual:bus-fail:note",
        occurredAt: "2026-09-04T15:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.published, false);
    assert.equal(first.activity.eventId, undefined);
    assert.equal(store.activities.size, 1);
    assert.equal(bus.events.length, 0);

    const retry = await recordGrowthActivity(
      store,
      {
        tenantId: "t1",
        personaId: "p1",
        kind: "note",
        summary: "Persistida",
        ingestKey: "manual:bus-fail:note",
        occurredAt: "2026-09-04T15:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(retry.ok, true);
    if (!retry.ok) return;
    assert.equal(retry.published, true);
    assert.ok(retry.activity.eventId);
    assert.equal(retry.activity._id, first.activity._id);
    assert.equal(store.activities.size, 1);
  });

  it("identity_conflict usa recordGrowthActivity (una sola implementación)", async () => {
    const store = createMemoryGrowthPersonaStore();
    const bus = createMemoryGrowthEventBus();

    await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "a@ex.com",
      origin: { kind: "manual", sourceCollection: "t", sourceId: "a" },
      now: "2026-09-04T16:00:00.000Z",
    });
    await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "+56911111111",
      origin: { kind: "manual", sourceCollection: "t", sourceId: "b" },
      now: "2026-09-04T16:01:00.000Z",
    });

    const conflict = await upsertGrowthPersona(
      store,
      {
        tenantId: "t1",
        email: "a@ex.com",
        phone: "+56911111111",
        origin: { kind: "manual", sourceCollection: "t", sourceId: "c" },
        sourceCollection: "t",
        sourceId: "c",
        now: "2026-09-04T16:02:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(conflict.ok, false);
    if (conflict.ok) return;
    assert.equal(conflict.reason, "identity_conflict");
    assert.equal(conflict.activity?.kind, "identity_conflict");
    assert.ok(conflict.activity?.eventId);
    assert.equal(bus.events[0]?.type, "GrowthActivityRecorded");

    // Reintento: no duplica
    const again = await upsertGrowthPersona(
      store,
      {
        tenantId: "t1",
        email: "a@ex.com",
        phone: "+56911111111",
        origin: { kind: "manual", sourceCollection: "t", sourceId: "c" },
        sourceCollection: "t",
        sourceId: "c",
        now: "2026-09-04T16:03:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(again.ok, false);
    if (again.ok || again.reason !== "identity_conflict") return;
    assert.equal(again.activity?._id, conflict.activity?._id);
    assert.equal(bus.events.length, 1);
  });

  it("admisión/forms: captación intacta; proyección vía lib/growth (CORE-005)", () => {
    const root = process.cwd();
    const admission = readFileSync(
      resolve(root, "src/core/admission/interesado-repository.ts"),
      "utf8"
    );
    // No escribe colecciones growth_* directamente; dual-write fail-soft
    assert.equal(/growth_personas|growth_oportunidades|growth_actividades/i.test(admission), false);
    assert.match(admission, /ingestInteresadoToGrowthSafe/);
    assert.match(admission, /adapter\.handoff/);

    const engine = readFileSync(
      resolve(root, "src/core/experience/forms/engine.ts"),
      "utf8"
    );
    assert.match(engine, /ingestFormSubmissionToGrowthSafe/);
    assert.match(engine, /await store\.save/);
  });

  it("migración 015 registrada", () => {
    assert.ok(MIGRATIONS.some((m) => m.id === "015-growth-actividades"));
  });
});

describe("OT-GROWTH-CORE-004 — índices Mongo (si hay URI)", () => {
  it("ensureGrowthActivityIndexes idempotente", async () => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log("skip: MONGODB_URI no configurada");
      return;
    }
    const client = new MongoClient(uri);
    try {
      await client.connect();
      const dbName =
        process.env.MONGODB_DB_NAME ||
        process.env.MONGODB_DB ||
        "portal_sem_test";
      const db = client.db(dbName);
      const first = await ensureGrowthActivityIndexes(db);
      const second = await ensureGrowthActivityIndexes(db);
      assert.ok(first.results.length >= 3);
      assert.ok(second.results.every((r) => r.result === "exists" || r.result === "created"));
      const mig = await migration015GrowthActividades.run({
        db,
        log: () => undefined,
      });
      assert.ok(mig.details?.length);
    } finally {
      await client.close();
    }
  });
});
