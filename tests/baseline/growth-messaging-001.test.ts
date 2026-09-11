/**
 * OT-GROWTH-MESSAGING-001 — base Conversación + Mensaje + GrowthMessageReceived.
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
  createMemoryGrowthMessagingStore,
  createMemoryGrowthOpportunityStore,
  createMemoryGrowthOpportunityWorkflow,
  createMemoryGrowthPersonaStore,
  ensureGrowthConversation,
  ensureGrowthMessagingIndexes,
  GROWTH_DOMAIN_EVENT_TYPES,
  GROWTH_MESSAGE_RECEIVED_EVENT,
  openGrowthOpportunity,
  recordGrowthInboundMessage,
  upsertGrowthPersona,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration018GrowthMessaging } from "../../src/core/migrations/018-growth-messaging";
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
    phone: "+5491111111111",
    origin: {
      kind: "manual",
      sourceCollection: "test",
      sourceId,
    },
    now: "2026-09-07T10:00:00.000Z",
  });
  assert.equal(r.ok, true);
  if (!r.ok) throw new Error("persona seed failed");
  return { personas, persona: r.persona };
}

describe("OT-GROWTH-MESSAGING-001 — evento", () => {
  it("GrowthMessageReceived en GROWTH_DOMAIN_EVENT_TYPES y catálogo del bus", () => {
    assert.equal(
      GROWTH_DOMAIN_EVENT_TYPES.includes(GROWTH_MESSAGE_RECEIVED_EVENT),
      true
    );
    assert.equal(DOMAIN_EVENT_TYPES.includes(GROWTH_MESSAGE_RECEIVED_EVENT), true);
    assert.equal(isKnownEventType(GROWTH_MESSAGE_RECEIVED_EVENT), true);
  });
});

describe("OT-GROWTH-MESSAGING-001 — conversaciones", () => {
  it("crea y reutiliza conversación por Persona+canal; opcional oportunidad", async () => {
    const { persona } = await seedPersona("space-a", "a@example.com", "p1");
    const store = createMemoryGrowthMessagingStore();

    const first = await ensureGrowthConversation(store, {
      tenantId: "space-a",
      personaId: persona._id,
      channel: "whatsapp",
      oportunidadId: "opp-1",
      now: "2026-09-07T12:00:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("ensure failed");
    assert.equal(first.created, true);
    assert.equal(first.conversation.personaId, persona._id);
    assert.equal(first.conversation.oportunidadId, "opp-1");
    assert.equal(first.conversation.channel, "whatsapp");

    const second = await ensureGrowthConversation(store, {
      tenantId: "space-a",
      personaId: persona._id,
      channel: "whatsapp",
      now: "2026-09-07T12:05:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("reuse failed");
    assert.equal(second.created, false);
    assert.equal(second.conversation._id, first.conversation._id);
    assert.equal(second.conversation.oportunidadId, "opp-1");

    // Otro canal = otra conversación (misma Persona)
    const ig = await ensureGrowthConversation(store, {
      tenantId: "space-a",
      personaId: persona._id,
      channel: "instagram",
      now: "2026-09-07T12:10:00.000Z",
    });
    assert.equal(ig.ok, true);
    if (!ig.ok) throw new Error("ig failed");
    assert.equal(ig.created, true);
    assert.notEqual(ig.conversation._id, first.conversation._id);
  });

  it("reutiliza por externalThreadId", async () => {
    const { persona } = await seedPersona("space-a", "b@example.com", "p2");
    const store = createMemoryGrowthMessagingStore();

    const first = await ensureGrowthConversation(store, {
      tenantId: "space-a",
      personaId: persona._id,
      channel: "whatsapp",
      externalThreadId: "wa-thread-1",
      now: "2026-09-07T12:00:00.000Z",
    });
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("first failed");

    const second = await ensureGrowthConversation(store, {
      tenantId: "space-a",
      personaId: persona._id,
      channel: "whatsapp",
      externalThreadId: "wa-thread-1",
      now: "2026-09-07T12:01:00.000Z",
    });
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("second failed");
    assert.equal(second.created, false);
    assert.equal(second.conversation._id, first.conversation._id);
  });

  it("aísla Espacios: misma Persona id no cruza tenants", async () => {
    const store = createMemoryGrowthMessagingStore();
    const a = await ensureGrowthConversation(store, {
      tenantId: "tenant-a",
      personaId: "same-persona-id",
      channel: "whatsapp",
      externalThreadId: "shared-looking-id",
      now: "2026-09-07T12:00:00.000Z",
    });
    const b = await ensureGrowthConversation(store, {
      tenantId: "tenant-b",
      personaId: "same-persona-id",
      channel: "whatsapp",
      externalThreadId: "shared-looking-id",
      now: "2026-09-07T12:00:00.000Z",
    });
    assert.equal(a.ok && b.ok, true);
    if (!a.ok || !b.ok) throw new Error("ensure failed");
    assert.notEqual(a.conversation._id, b.conversation._id);
    assert.equal(a.conversation.tenantId, "tenant-a");
    assert.equal(b.conversation.tenantId, "tenant-b");
  });
});

describe("OT-GROWTH-MESSAGING-001 — mensajes", () => {
  it("guarda mensaje entrante, relaciona Persona y emite GrowthMessageReceived", async () => {
    const { persona } = await seedPersona("space-a", "c@example.com", "p3");
    const store = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const result = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "space-a",
        personaId: persona._id,
        channel: "whatsapp",
        body: "Hola, quiero info",
        externalMessageId: "wa-msg-1",
        externalThreadId: "wa-thread-9",
        occurredAt: "2026-09-07T13:00:00.000Z",
      },
      { eventBus: bus }
    );

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("inbound failed");
    assert.equal(result.conversationCreated, true);
    assert.equal(result.duplicated, false);
    assert.equal(result.published, true);
    assert.equal(result.message.direction, "inbound");
    assert.equal(result.message.status, "received");
    assert.equal(result.conversation.personaId, persona._id);
    assert.equal(result.message.eventId, "evt-mem-1");

    assert.equal(bus.events.length, 1);
    assert.equal(bus.events[0].type, GROWTH_MESSAGE_RECEIVED_EVENT);
    assert.equal(bus.events[0].tenantId, "space-a");
    assert.equal(bus.events[0].entityType, "growth.message");
    assert.equal(bus.events[0].payload?.personaId, persona._id);
    assert.equal(bus.events[0].payload?.channel, "whatsapp");
    assert.equal(bus.events[0].payload?.direction, "inbound");
  });

  it("no duplica mensaje externo ni republica el evento", async () => {
    const { persona } = await seedPersona("space-a", "d@example.com", "p4");
    const store = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const first = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "space-a",
        personaId: persona._id,
        channel: "whatsapp",
        body: "primero",
        externalMessageId: "wa-dup-1",
        occurredAt: "2026-09-07T14:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("first failed");

    const second = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "space-a",
        personaId: persona._id,
        channel: "whatsapp",
        body: "reintento",
        externalMessageId: "wa-dup-1",
        occurredAt: "2026-09-07T14:01:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("second failed");
    assert.equal(second.duplicated, true);
    assert.equal(second.published, false);
    assert.equal(second.message._id, first.message._id);
    assert.equal(second.message.body, "primero");
    assert.equal(bus.events.length, 1);
    assert.equal(store.messages.size, 1);
  });

  it("oportunidad opcional en la conversación (solo FK)", async () => {
    const { persona } = await seedPersona("space-a", "e@example.com", "p5");
    const oppStore = createMemoryGrowthOpportunityStore();
    const workflow = createMemoryGrowthOpportunityWorkflow();
    const bus = createMemoryGrowthEventBus();

    const opened = await openGrowthOpportunity(oppStore, workflow, {
      tenantId: "space-a",
      personaId: persona._id,
      typeKey: "inquiry",
      subjectType: "none",
      origin: {
        kind: "manual",
        sourceCollection: "test",
        sourceId: "opp-src-1",
      },
      sourceCollection: "test",
      sourceId: "opp-src-1",
      now: "2026-09-07T15:00:00.000Z",
      eventBus: bus,
    });
    assert.equal(opened.ok, true);
    if (!opened.ok) throw new Error("opp failed");

    const msgStore = createMemoryGrowthMessagingStore();
    const result = await recordGrowthInboundMessage(
      msgStore,
      {
        tenantId: "space-a",
        personaId: persona._id,
        channel: "web_chat",
        body: "consulta web",
        oportunidadId: opened.oportunidad._id,
        externalMessageId: "web-1",
        occurredAt: "2026-09-07T15:01:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("msg failed");
    assert.equal(result.conversation.oportunidadId, opened.oportunidad._id);
    assert.equal(
      bus.events.some((e) => e.type === GROWTH_MESSAGE_RECEIVED_EVENT),
      true
    );
    // Sin snapshot de oportunidad en el mensaje
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.message, "oportunidad"),
      false
    );
  });

  it("mismo externalMessageId en otro Espacio no colisiona", async () => {
    const store = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const a = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "tenant-a",
        personaId: "pa",
        channel: "whatsapp",
        body: "a",
        externalMessageId: "ext-same",
        occurredAt: "2026-09-07T16:00:00.000Z",
      },
      { eventBus: bus }
    );
    const b = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "tenant-b",
        personaId: "pb",
        channel: "whatsapp",
        body: "b",
        externalMessageId: "ext-same",
        occurredAt: "2026-09-07T16:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(a.ok && b.ok, true);
    if (!a.ok || !b.ok) throw new Error("isolation failed");
    assert.notEqual(a.message._id, b.message._id);
    assert.equal(store.messages.size, 2);
    assert.equal(bus.events.length, 2);
  });

  it("fallo del Event Bus no borra el mensaje", async () => {
    const store = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();
    bus.failNext = true;

    const result = await recordGrowthInboundMessage(
      store,
      {
        tenantId: "space-a",
        personaId: "p-bus",
        channel: "facebook",
        body: "fb msg",
        externalMessageId: "fb-1",
        occurredAt: "2026-09-07T17:00:00.000Z",
      },
      { eventBus: bus }
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("failed");
    assert.equal(result.published, false);
    assert.equal(result.message.eventId, undefined);
    assert.equal(store.messages.size, 1);
  });
});

describe("OT-GROWTH-MESSAGING-001 — migración", () => {
  it("018-growth-messaging registrada", () => {
    assert.equal(
      MIGRATIONS.some((m) => m.id === "018-growth-messaging"),
      true
    );
    assert.equal(migration018GrowthMessaging.id, "018-growth-messaging");
  });

  it("ensureGrowthMessagingIndexes es idempotente (si hay Mongo)", async () => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      // Entorno sin Mongo: se valida registro; índices se ejercen en CI con URI
      assert.ok(true);
      return;
    }
    const client = new MongoClient(uri);
    await client.connect();
    try {
      const db = client.db(
        process.env.MONGODB_DB || `portal_sem_test_msg_${Date.now()}`
      );
      const first = await ensureGrowthMessagingIndexes(db);
      const second = await ensureGrowthMessagingIndexes(db);
      assert.ok(first.results.length >= 4);
      assert.ok(second.results.every((r) => r.result === "exists" || r.result === "created"));
    } finally {
      await client.close();
    }
  });
});
