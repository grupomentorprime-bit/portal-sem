/**
 * OT-GROWTH-MESSAGING-002 — webhook WhatsApp Cloud API → Conversaciones.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthMessagingStore,
  createMemoryGrowthPersonaStore,
  createMemoryGrowthWhatsAppConnectionStore,
  ensureGrowthWhatsAppIndexes,
  extractWhatsAppInboundMessages,
  GROWTH_MESSAGE_RECEIVED_EVENT,
  GROWTH_WHATSAPP_CONNECTIONS_COLLECTION,
  receiveWhatsAppCloudWebhook,
  signWhatsAppHubBody,
  toPublicWhatsAppConnection,
  upsertGrowthPersona,
  upsertGrowthWhatsAppConnection,
  verifyWhatsAppWebhookSubscription,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration019GrowthWhatsApp } from "../../src/core/migrations/019-growth-whatsapp";
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

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function cloudTextPayload(opts: {
  phoneNumberId: string;
  wabaId?: string;
  from: string;
  messageId: string;
  body: string;
  profileName?: string;
  timestamp?: string;
}): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: opts.wabaId ?? "waba-test",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550001111",
                phone_number_id: opts.phoneNumberId,
              },
              contacts: [
                {
                  profile: { name: opts.profileName ?? "Ana" },
                  wa_id: opts.from,
                },
              ],
              messages: [
                {
                  from: opts.from,
                  id: opts.messageId,
                  timestamp: opts.timestamp ?? "1757260800",
                  type: "text",
                  text: { body: opts.body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function statusOnlyPayload(phoneNumberId: string): Record<string, unknown> {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-test",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { phone_number_id: phoneNumberId },
              statuses: [
                { id: "wamid.status-1", status: "delivered", timestamp: "1757260800" },
              ],
            },
          },
        ],
      },
    ],
  };
}

async function seedConnection(
  tenantId: string,
  phoneNumberId: string,
  secrets: { verifyToken: string; appSecret: string }
) {
  const connections = createMemoryGrowthWhatsAppConnectionStore();
  const upserted = await upsertGrowthWhatsAppConnection(connections, {
    tenantId,
    phoneNumberId,
    verifyToken: secrets.verifyToken,
    appSecret: secrets.appSecret,
    now: "2026-09-07T20:00:00.000Z",
  });
  assert.equal(upserted.ok, true);
  if (!upserted.ok) throw new Error("connection seed failed");
  return connections;
}

describe("OT-GROWTH-MESSAGING-002 — verificación webhook", () => {
  it("GET subscribe con verify_token válido devuelve el challenge", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "token-espacio-a",
      appSecret: "secret-a",
    });

    const ok = await verifyWhatsAppWebhookSubscription(connections, {
      mode: "subscribe",
      token: "token-espacio-a",
      challenge: "challenge-99",
    });
    assert.equal(ok.ok, true);
    if (!ok.ok) throw new Error("verify failed");
    assert.equal(ok.challenge, "challenge-99");
  });

  it("GET con token inválido o modo incorrecto no verifica", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "token-espacio-a",
      appSecret: "secret-a",
    });

    const badToken = await verifyWhatsAppWebhookSubscription(connections, {
      mode: "subscribe",
      token: "otro-token",
      challenge: "challenge-99",
    });
    assert.equal(badToken.ok, false);

    const badMode = await verifyWhatsAppWebhookSubscription(connections, {
      mode: "unsubscribe",
      token: "token-espacio-a",
      challenge: "challenge-99",
    });
    assert.equal(badMode.ok, false);
  });
});

describe("OT-GROWTH-MESSAGING-002 — parseo Cloud API", () => {
  it("extrae texto y ignora statuses", () => {
    const messages = extractWhatsAppInboundMessages(
      cloudTextPayload({
        phoneNumberId: "pn-a",
        from: "56911112222",
        messageId: "wamid.1",
        body: "Hola, quiero info",
        profileName: "Ana Pérez",
      })
    );
    assert.equal(messages.length, 1);
    assert.equal(messages[0].from, "56911112222");
    assert.equal(messages[0].body, "Hola, quiero info");
    assert.equal(messages[0].messageId, "wamid.1");
    assert.equal(messages[0].profileName, "Ana Pérez");

    const statuses = extractWhatsAppInboundMessages(statusOnlyPayload("pn-a"));
    assert.equal(statuses.length, 0);
  });
});

describe("OT-GROWTH-MESSAGING-002 — inbound", () => {
  it("mensaje de Persona existente entra a la conversación y publica GrowthMessageReceived", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "tok-a",
      appSecret: "app-secret-a",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const seeded = await upsertGrowthPersona(personas, {
      tenantId: "space-a",
      email: "ana@example.com",
      phone: "+56 9 1111 2222",
      displayName: "Ana Pérez",
      origin: {
        kind: "form",
        channel: "contact",
        sourceCollection: "test",
        sourceId: "form-1",
      },
      now: "2026-09-01T10:00:00.000Z",
    });
    assert.equal(seeded.ok, true);
    if (!seeded.ok) throw new Error("persona seed failed");
    const originKind = seeded.persona.origin.kind;

    const payload = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56911112222",
      messageId: "wamid.existing-1",
      body: "Hola, sigo interesada",
    });
    const rawBody = JSON.stringify(payload);
    const result = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      {
        rawBody,
        signatureHeader: signWhatsAppHubBody(rawBody, "app-secret-a"),
        now: "2026-09-07T21:00:00.000Z",
      }
    );

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("receive failed");
    assert.equal(result.processed.length, 1);
    assert.equal(result.processed[0].personaCreated, false);
    assert.equal(result.processed[0].personaId, seeded.persona._id);
    assert.equal(result.processed[0].conversationCreated, true);
    assert.equal(result.processed[0].published, true);
    assert.equal(personas.personas.size, 1);
    assert.equal(messaging.messages.size, 1);
    assert.equal(bus.events.length, 1);
    assert.equal(bus.events[0].type, GROWTH_MESSAGE_RECEIVED_EVENT);
    assert.equal(bus.events[0].tenantId, "space-a");
    assert.equal(bus.events[0].payload?.channel, "whatsapp");
    assert.equal(bus.events[0].payload?.externalMessageId, "wamid.existing-1");
    const rematch = await personas.findById("space-a", seeded.persona._id);
    assert.equal(rematch?.origin.kind, originKind);
  });

  it("teléfono nuevo crea Persona con el mecanismo existente y reutiliza conversación", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "tok-a",
      appSecret: "app-secret-a",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const firstPayload = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56988887777",
      messageId: "wamid.new-1",
      body: "Primera vez",
      profileName: "Luis Soto",
    });
    const firstRaw = JSON.stringify(firstPayload);
    const first = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      {
        rawBody: firstRaw,
        signatureHeader: signWhatsAppHubBody(firstRaw, "app-secret-a"),
        now: "2026-09-07T21:10:00.000Z",
      }
    );
    assert.equal(first.ok, true);
    if (!first.ok) throw new Error("first failed");
    assert.equal(first.processed[0].personaCreated, true);
    assert.equal(first.processed[0].conversationCreated, true);
    assert.equal(personas.personas.size, 1);
    const persona = [...personas.personas.values()][0];
    assert.equal(persona.displayName, "Luis Soto");
    assert.equal(persona.origin.kind, "unknown");
    assert.equal(persona.origin.channel, "whatsapp");
    assert.equal(persona.origin.sourceCollection, "whatsapp_cloud");

    const secondPayload = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56988887777",
      messageId: "wamid.new-2",
      body: "Segundo mensaje",
    });
    const secondRaw = JSON.stringify(secondPayload);
    const second = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      {
        rawBody: secondRaw,
        signatureHeader: signWhatsAppHubBody(secondRaw, "app-secret-a"),
        now: "2026-09-07T21:11:00.000Z",
      }
    );
    assert.equal(second.ok, true);
    if (!second.ok) throw new Error("second failed");
    assert.equal(second.processed[0].personaCreated, false);
    assert.equal(second.processed[0].conversationCreated, false);
    assert.equal(second.processed[0].personaId, persona._id);
    assert.equal(messaging.conversations.size, 1);
    assert.equal(messaging.messages.size, 2);
    assert.equal(personas.personas.size, 1);
  });

  it("reintento de Meta con el mismo wamid no duplica ni republica", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "tok-a",
      appSecret: "app-secret-a",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const payload = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56977776666",
      messageId: "wamid.retry-1",
      body: "único",
    });
    const rawBody = JSON.stringify(payload);
    const header = signWhatsAppHubBody(rawBody, "app-secret-a");

    const first = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      { rawBody, signatureHeader: header }
    );
    const retry = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      { rawBody, signatureHeader: header }
    );

    assert.equal(first.ok && retry.ok, true);
    if (!first.ok || !retry.ok) throw new Error("retry failed");
    assert.equal(retry.processed[0].duplicated, true);
    assert.equal(retry.processed[0].published, false);
    assert.equal(messaging.messages.size, 1);
    assert.equal(bus.events.length, 1);
  });

  it("aisla dos Espacios: un número conectado solo resuelve el suyo", async () => {
    const connections = createMemoryGrowthWhatsAppConnectionStore();
    const a = await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-a",
      phoneNumberId: "pn-a",
      verifyToken: "tok-a",
      appSecret: "app-secret-a",
    });
    const b = await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-b",
      phoneNumberId: "pn-b",
      verifyToken: "tok-b",
      appSecret: "app-secret-b",
    });
    assert.equal(a.ok && b.ok, true);

    const claimed = await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-b",
      phoneNumberId: "pn-a",
      verifyToken: "tok-b",
      appSecret: "app-secret-b",
    });
    assert.equal(claimed.ok, false);
    if (claimed.ok) throw new Error("should reject stolen number");
    assert.equal(claimed.reason, "phone_number_in_use");

    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();

    const payloadA = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56911110001",
      messageId: "wamid.iso-a",
      body: "mensaje A",
    });
    const rawA = JSON.stringify(payloadA);
    const recvA = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      {
        rawBody: rawA,
        signatureHeader: signWhatsAppHubBody(rawA, "app-secret-a"),
      }
    );

    const payloadB = cloudTextPayload({
      phoneNumberId: "pn-b",
      from: "56911110002",
      messageId: "wamid.iso-b",
      body: "mensaje B",
    });
    const rawB = JSON.stringify(payloadB);
    const recvB = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging, eventBus: bus },
      {
        rawBody: rawB,
        signatureHeader: signWhatsAppHubBody(rawB, "app-secret-b"),
      }
    );

    assert.equal(recvA.ok && recvB.ok, true);
    if (!recvA.ok || !recvB.ok) throw new Error("isolation receive failed");
    assert.equal(recvA.processed[0].tenantId, "space-a");
    assert.equal(recvB.processed[0].tenantId, "space-b");
    assert.notEqual(recvA.processed[0].personaId, recvB.processed[0].personaId);

    const msgsA = [...messaging.messages.values()].filter(
      (m) => m.tenantId === "space-a"
    );
    const msgsB = [...messaging.messages.values()].filter(
      (m) => m.tenantId === "space-b"
    );
    assert.equal(msgsA.length, 1);
    assert.equal(msgsB.length, 1);
    assert.equal(msgsA[0].body, "mensaje A");
    assert.equal(msgsB[0].body, "mensaje B");
  });

  it("firma inválida, payload inválido o número desconocido no ingresan", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "tok-a",
      appSecret: "app-secret-a",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const bus = createMemoryGrowthEventBus();
    const deps = { connections, personas, messaging, eventBus: bus };

    const payload = cloudTextPayload({
      phoneNumberId: "pn-a",
      from: "56911112222",
      messageId: "wamid.sec-1",
      body: "no debe entrar",
    });
    const rawBody = JSON.stringify(payload);

    const badSig = await receiveWhatsAppCloudWebhook(deps, {
      rawBody,
      signatureHeader: signWhatsAppHubBody(rawBody, "otro-secret"),
    });
    assert.equal(badSig.ok, false);
    if (badSig.ok) throw new Error("bad sig should fail");
    assert.equal(badSig.reason, "invalid_signature");
    assert.equal(badSig.httpStatus, 403);

    const invalid = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: "no-json",
      signatureHeader: signWhatsAppHubBody("no-json", "app-secret-a"),
    });
    assert.equal(invalid.ok, false);
    if (invalid.ok) throw new Error("invalid payload should fail");
    assert.equal(invalid.reason, "invalid_payload");
    assert.equal(invalid.httpStatus, 400);

    const unknownPn = cloudTextPayload({
      phoneNumberId: "pn-desconocido",
      from: "56911112222",
      messageId: "wamid.sec-2",
      body: "tampoco",
    });
    const rawUnknown = JSON.stringify(unknownPn);
    const unknown = await receiveWhatsAppCloudWebhook(deps, {
      rawBody: rawUnknown,
      signatureHeader: signWhatsAppHubBody(rawUnknown, "app-secret-a"),
    });
    assert.equal(unknown.ok, false);
    if (unknown.ok) throw new Error("unknown number should fail");
    assert.equal(unknown.reason, "unknown_phone_number");

    assert.equal(messaging.messages.size, 0);
    assert.equal(personas.personas.size, 0);
    assert.equal(bus.events.length, 0);
  });

  it("statuses no crean mensaje; la vista pública no expone secretos", async () => {
    const connections = await seedConnection("space-a", "pn-a", {
      verifyToken: "tok-secreto",
      appSecret: "app-secreto",
    });
    const personas = createMemoryGrowthPersonaStore();
    const messaging = createMemoryGrowthMessagingStore();
    const rawBody = JSON.stringify(statusOnlyPayload("pn-a"));
    const result = await receiveWhatsAppCloudWebhook(
      { connections, personas, messaging },
      {
        rawBody,
        signatureHeader: signWhatsAppHubBody(rawBody, "app-secreto"),
      }
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("status receive failed");
    assert.equal(result.processed.length, 0);
    assert.equal(messaging.messages.size, 0);

    const connection = await connections.findByTenantId("space-a");
    assert.ok(connection);
    const pub = toPublicWhatsAppConnection(connection);
    assert.equal("verifyToken" in pub, false);
    assert.equal("appSecret" in pub, false);
    assert.equal(pub.hasVerifyToken, true);
    assert.equal(pub.hasAppSecret, true);
    assert.equal(JSON.stringify(pub).includes("tok-secreto"), false);
    assert.equal(JSON.stringify(pub).includes("app-secreto"), false);
  });
});

describe("OT-GROWTH-MESSAGING-002 — frontera", () => {
  it("secretos no viven en el documento del Espacio ni en MESSAGING-001", () => {
    const spaceConfig = readSrc("src/core/growth/space-config.ts");
    const spaceTypes = readSrc("src/core/growth/types.ts");
    const messagingRecord = readSrc(
      "src/core/growth/messaging/record-inbound-message.ts"
    );
    assert.equal(spaceConfig.toLowerCase().includes("whatsapp"), false);
    assert.equal(spaceTypes.includes("verifyToken"), false);
    assert.equal(spaceTypes.includes("appSecret"), false);
    assert.equal(spaceTypes.includes("phoneNumberId"), false);
    assert.match(messagingRecord, /recordGrowthInboundMessage/);
    assert.equal(messagingRecord.includes("phone_number_id"), false);
    assert.equal(messagingRecord.includes("X-Hub-Signature"), false);
    assert.equal(messagingRecord.includes("verify_token"), false);

    const webhook = readSrc("src/app/api/webhooks/whatsapp/route.ts");
    assert.match(webhook, /hub\.verify_token/);
    assert.match(webhook, /x-hub-signature-256/);
    assert.match(webhook, /receiveWhatsAppCloudWebhook/);
    assert.equal(webhook.includes("console.log"), false);
    assert.equal(webhook.includes("NEXT_PUBLIC"), false);

    const persist = readSrc("src/lib/growth/whatsapp-connections.ts");
    assert.match(persist, /encryptSecret/);
    assert.match(persist, /verifyTokenEncrypted/);
    assert.match(persist, /appSecretEncrypted/);
    assert.equal(persist.includes("GROWTH_SPACE_CONFIG_COLLECTION"), false);
    assert.equal(/collection\(\s*["']growth_space_config["']/.test(persist), false);
  });

  it("019-growth-whatsapp registrada", () => {
    assert.equal(
      MIGRATIONS.some((m) => m.id === "019-growth-whatsapp"),
      true
    );
    assert.equal(migration019GrowthWhatsApp.id, "019-growth-whatsapp");
    assert.equal(GROWTH_WHATSAPP_CONNECTIONS_COLLECTION, "growth_whatsapp_connections");
  });

  it("ensureGrowthWhatsAppIndexes es idempotente (si hay Mongo)", async () => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      assert.ok(true);
      return;
    }
    const client = new MongoClient(uri);
    await client.connect();
    try {
      const db = client.db(
        process.env.MONGODB_DB || `portal_sem_test_wa_${Date.now()}`
      );
      const first = await ensureGrowthWhatsAppIndexes(db);
      const second = await ensureGrowthWhatsAppIndexes(db);
      assert.equal(first.results.length, 2);
      assert.ok(
        second.results.every((r) => r.result === "exists" || r.result === "created")
      );
    } finally {
      await client.close();
    }
  });
});
