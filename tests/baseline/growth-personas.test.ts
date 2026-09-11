/**
 * OT-GROWTH-CORE-002 — Persona + Origen + dedupe (ADR-010 §4.2).
 * Store en memoria: sin Mongo obligatorio. Integración de índices si hay URI.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  buildGrowthIngestKey,
  createMemoryGrowthPersonaStore,
  ensureGrowthPersonaIndexes,
  normalizeGrowthEmail,
  normalizeGrowthPhone,
  updateGrowthPersonaContact,
  upsertGrowthPersona,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration013GrowthPersonas } from "../../src/core/migrations/013-growth-personas";

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

function origin(sourceId: string) {
  return {
    kind: "admission" as const,
    channel: "portal-admision",
    sourceCollection: "portal_interesados",
    sourceId,
  };
}

describe("OT-GROWTH-CORE-002 — normalización", () => {
  it("email: trim + lower", () => {
    assert.deepEqual(normalizeGrowthEmail("  Ana@Example.COM "), {
      email: "ana@example.com",
      emailNormalized: "ana@example.com",
    });
  });

  it("teléfono Chile → dígitos nacionales", () => {
    const n = normalizeGrowthPhone("+56 9 1234 5678");
    assert.equal(n.phoneNormalized, "912345678");
    assert.ok(n.phone?.includes("9"));
  });

  it("teléfono no Chile → dígitos", () => {
    assert.deepEqual(normalizeGrowthPhone("+1 (415) 555-0100"), {
      phone: "+1 (415) 555-0100",
      phoneNormalized: "14155550100",
    });
  });

  it("ingestKey estable", () => {
    assert.equal(
      buildGrowthIngestKey("portal_interesados", "abc", "identity_conflict"),
      "portal_interesados:abc:identity_conflict"
    );
  });
});

describe("OT-GROWTH-CORE-002 — upsert / dedupe", () => {
  it("alta solo email / solo teléfono / ambos", async () => {
    const store = createMemoryGrowthPersonaStore();

    const emailOnly = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "a@ex.com",
      origin: origin("e1"),
      now: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(emailOnly.ok, true);
    if (!emailOnly.ok) return;
    assert.equal(emailOnly.outcome, "created");
    assert.equal(emailOnly.persona.emailNormalized, "a@ex.com");
    assert.equal(emailOnly.persona.phoneNormalized, undefined);
    assert.equal(emailOnly.persona.origin.kind, "admission");

    const phoneOnly = await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "+56 9 1111 2222",
      origin: origin("p1"),
      now: "2026-01-01T00:00:01.000Z",
    });
    assert.equal(phoneOnly.ok, true);
    if (!phoneOnly.ok) return;
    assert.equal(phoneOnly.outcome, "created");
    assert.equal(phoneOnly.persona.phoneNormalized, "911112222");

    const both = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "both@ex.com",
      phone: "+56 9 3333 4444",
      firstName: "Both",
      lastName: "User",
      origin: origin("b1"),
      now: "2026-01-01T00:00:02.000Z",
    });
    assert.equal(both.ok, true);
    if (!both.ok) return;
    assert.equal(both.outcome, "created");
    assert.equal(both.persona.emailNormalized, "both@ex.com");
    assert.equal(both.persona.phoneNormalized, "933334444");
    assert.equal(store.personas.size, 3);
  });

  it("mismo email → misma Persona; completa teléfono", async () => {
    const store = createMemoryGrowthPersonaStore();
    const first = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "same@ex.com",
      displayName: "",
      origin: origin("s1"),
      now: "2026-01-02T00:00:00.000Z",
    });
    assert.ok(first.ok);
    if (!first.ok) return;

    const second = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "SAME@ex.com",
      phone: "+56 9 5555 6666",
      displayName: "Ana Pérez",
      origin: {
        kind: "form",
        sourceCollection: "experience_form_submissions",
        sourceId: "s2",
      },
      now: "2026-01-02T01:00:00.000Z",
    });
    assert.ok(second.ok);
    if (!second.ok) return;
    assert.equal(second.outcome, "matched");
    assert.equal(second.persona._id, first.persona._id);
    assert.equal(second.persona.phoneNormalized, "955556666");
    // Origen inmutable al alta
    assert.equal(second.persona.origin.sourceId, "s1");
    assert.equal(second.persona.origin.kind, "admission");
    // displayName solo si estaba vacío
    assert.equal(second.persona.displayName, "Ana Pérez");
    assert.equal(store.personas.size, 1);
  });

  it("mismo teléfono → misma Persona; completa email", async () => {
    const store = createMemoryGrowthPersonaStore();
    const first = await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "+56 9 7777 8888",
      origin: origin("ph1"),
      now: "2026-01-03T00:00:00.000Z",
    });
    assert.ok(first.ok);
    if (!first.ok) return;

    const second = await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "56977778888",
      email: "phone-match@ex.com",
      origin: origin("ph2"),
      now: "2026-01-03T01:00:00.000Z",
    });
    assert.ok(second.ok);
    if (!second.ok) return;
    assert.equal(second.outcome, "matched");
    assert.equal(second.persona._id, first.persona._id);
    assert.equal(second.persona.emailNormalized, "phone-match@ex.com");
    assert.equal(second.persona.origin.sourceId, "ph1");
  });

  it("mismo email/teléfono en tenants distintos → Personas distintas", async () => {
    const store = createMemoryGrowthPersonaStore();
    const a = await upsertGrowthPersona(store, {
      tenantId: "tenant-a",
      email: "cross@ex.com",
      phone: "+56 9 1010 1010",
      origin: origin("ca"),
      now: "2026-01-04T00:00:00.000Z",
    });
    const b = await upsertGrowthPersona(store, {
      tenantId: "tenant-b",
      email: "cross@ex.com",
      phone: "+56 9 1010 1010",
      origin: origin("cb"),
      now: "2026-01-04T00:00:01.000Z",
    });
    assert.ok(a.ok && b.ok);
    if (!a.ok || !b.ok) return;
    assert.notEqual(a.persona._id, b.persona._id);
    assert.equal(store.personas.size, 2);
  });

  it("email→A y teléfono→B → identity_conflict sin merge", async () => {
    const store = createMemoryGrowthPersonaStore();
    const a = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "a@ex.com",
      origin: origin("a"),
      now: "2026-01-05T00:00:00.000Z",
    });
    const b = await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "+56 9 2020 2020",
      origin: origin("b"),
      now: "2026-01-05T00:00:01.000Z",
    });
    assert.ok(a.ok && b.ok);
    if (!a.ok || !b.ok) return;

    const conflict = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "a@ex.com",
      phone: "+56 9 2020 2020",
      origin: origin("c"),
      sourceCollection: "portal_interesados",
      sourceId: "conflict-src",
      now: "2026-01-05T00:00:02.000Z",
    });
    assert.equal(conflict.ok, false);
    if (conflict.ok) return;
    assert.equal(conflict.reason, "identity_conflict");
    assert.equal(conflict.emailPersonaId, a.persona._id);
    assert.equal(conflict.phonePersonaId, b.persona._id);
    assert.ok(conflict.activity);
    assert.equal(conflict.activity?.kind, "identity_conflict");
    assert.equal(store.personas.size, 2);
    // Sin merge: A sin teléfono de B; B sin email de A
    const aDoc = await store.findById("t1", a.persona._id);
    const bDoc = await store.findById("t1", b.persona._id);
    assert.equal(aDoc?.phoneNormalized, undefined);
    assert.equal(bDoc?.emailNormalized, undefined);
  });

  it("reintento idempotente → no duplica Persona ni conflicto", async () => {
    const store = createMemoryGrowthPersonaStore();
    const input = {
      tenantId: "t1",
      email: "idem@ex.com",
      phone: "+56 9 3030 3030",
      origin: origin("idem-1"),
      sourceCollection: "portal_interesados",
      sourceId: "idem-1",
      now: "2026-01-06T00:00:00.000Z",
    };
    const first = await upsertGrowthPersona(store, input);
    const second = await upsertGrowthPersona(store, {
      ...input,
      now: "2026-01-06T00:00:01.000Z",
    });
    assert.ok(first.ok && second.ok);
    if (!first.ok || !second.ok) return;
    assert.equal(first.outcome, "created");
    assert.equal(second.outcome, "matched");
    assert.equal(first.persona._id, second.persona._id);
    assert.equal(store.personas.size, 1);

    const phoneOnly = await upsertGrowthPersona(store, {
      tenantId: "t1",
      phone: "+56 9 5050 5050",
      origin: origin("phone-only"),
      now: "2026-01-06T00:00:04.000Z",
    });
    assert.ok(phoneOnly.ok);

    const conflictInput = {
      tenantId: "t1",
      email: "idem@ex.com",
      phone: "+56 9 5050 5050",
      origin: origin("cf"),
      sourceCollection: "portal_interesados",
      sourceId: "conflict-idem",
      now: "2026-01-06T00:00:05.000Z",
    };
    const conflict1 = await upsertGrowthPersona(store, conflictInput);
    const conflict2 = await upsertGrowthPersona(store, {
      ...conflictInput,
      now: "2026-01-06T00:00:06.000Z",
    });
    assert.equal(conflict1.ok, false);
    assert.equal(conflict2.ok, false);
    if (conflict1.ok || conflict2.ok) return;
    assert.equal(conflict1.reason, "identity_conflict");
    assert.equal(conflict2.reason, "identity_conflict");
    if (
      conflict1.reason !== "identity_conflict" ||
      conflict2.reason !== "identity_conflict"
    ) {
      return;
    }
    assert.equal(conflict1.activity?._id, conflict2.activity?._id);
    assert.equal(store.activities.size, 1);
  });

  it("sin email ni teléfono → no crea Persona", async () => {
    const store = createMemoryGrowthPersonaStore();
    const r = await upsertGrowthPersona(store, {
      tenantId: "t1",
      displayName: "Nadie",
      origin: origin("none"),
    });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "missing_identity");
    assert.equal(store.personas.size, 0);
  });

  it("cambio posterior de email no rompe identidad ni merge silencioso", async () => {
    const store = createMemoryGrowthPersonaStore();
    const persona = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "old@ex.com",
      phone: "+56 9 6060 6060",
      origin: origin("u1"),
      now: "2026-01-07T00:00:00.000Z",
    });
    assert.ok(persona.ok);
    if (!persona.ok) return;

    const updated = await updateGrowthPersonaContact(store, {
      tenantId: "t1",
      personaId: persona.persona._id,
      email: "new@ex.com",
      now: "2026-01-07T01:00:00.000Z",
    });
    assert.ok(updated.ok);
    if (!updated.ok) return;
    assert.equal(updated.persona._id, persona.persona._id);
    assert.equal(updated.persona.emailNormalized, "new@ex.com");
    assert.ok(
      updated.persona.emails.some((a) => a.normalized === "old@ex.com"),
      "alias del email anterior"
    );
    assert.equal(updated.persona.origin.sourceId, "u1");

    // Otra Persona con el email destino → conflicto, sin robar
    const other = await upsertGrowthPersona(store, {
      tenantId: "t1",
      email: "taken@ex.com",
      origin: origin("u2"),
      now: "2026-01-07T02:00:00.000Z",
    });
    assert.ok(other.ok);
    if (!other.ok) return;

    const steal = await updateGrowthPersonaContact(store, {
      tenantId: "t1",
      personaId: persona.persona._id,
      email: "taken@ex.com",
      sourceCollection: "manual",
      sourceId: "steal-1",
      now: "2026-01-07T03:00:00.000Z",
    });
    assert.equal(steal.ok, false);
    if (steal.ok) return;
    assert.equal(steal.reason, "identity_conflict");
    const still = await store.findById("t1", persona.persona._id);
    assert.equal(still?.emailNormalized, "new@ex.com");
  });

  it("código: no convierte identity_users / content_people / portal_interesados", () => {
    const upsert = readFileSync(
      resolve(process.cwd(), "src/core/growth/upsert-persona.ts"),
      "utf8"
    );
    const repo = readFileSync(
      resolve(process.cwd(), "src/core/growth/repository.ts"),
      "utf8"
    );
    for (const src of [upsert, repo]) {
      assert.equal(src.includes('collection("identity_users")'), false);
      assert.equal(src.includes('collection("content_people")'), false);
      assert.equal(src.includes('collection("portal_interesados")'), false);
      assert.equal(src.includes("createInteresado"), false);
    }
    const interesado = readFileSync(
      resolve(process.cwd(), "src/core/admission/interesado-repository.ts"),
      "utf8"
    );
    // CORE-005: no llama upsertGrowthPersona directo; usa live-ingest
    assert.equal(interesado.includes("growth_personas"), false);
    assert.equal(interesado.includes("upsertGrowthPersona"), false);
    assert.match(interesado, /ingestInteresadoToGrowthSafe/);
  });
});

describe("OT-GROWTH-CORE-002 — índices", () => {
  it("migración 013 registrada", () => {
    const registry = readFileSync(
      resolve(process.cwd(), "src/core/migrations/registry.ts"),
      "utf8"
    );
    assert.match(registry, /migration013GrowthPersonas/);
    assert.equal(migration013GrowthPersonas.id, "013-growth-personas");
  });

  it("ensureGrowthPersonaIndexes idempotente (si hay Mongo)", async (t) => {
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
      const first = await ensureGrowthPersonaIndexes(db);
      const second = await ensureGrowthPersonaIndexes(db);
      assert.ok(first.results.length >= 3);
      assert.equal(second.results.length, first.results.length);
      // Segunda pasada: exists o created (idempotente, no lanza)
      for (const r of second.results) {
        assert.ok(r.result === "created" || r.result === "exists");
      }
    } finally {
      await client.close();
    }
  });
});
