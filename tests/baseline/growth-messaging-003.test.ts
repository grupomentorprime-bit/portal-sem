/**
 * OT-GROWTH-MESSAGING-003 — responder WhatsApp (Cloud API outbound).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthMessagingStore,
  createMemoryGrowthWhatsAppConnectionStore,
  ensureGrowthConversation,
  ensureGrowthMessagingIndexes,
  evaluateWhatsAppServiceWindow,
  GROWTH_MESSAGE_SENT_EVENT,
  parseWhatsAppRecipientFromThreadId,
  recordGrowthInboundMessage,
  sendWhatsAppReply,
  toPublicWhatsAppConnection,
  upsertGrowthWhatsAppConnection,
  type WhatsAppCloudApiPort,
} from "../../src/core/growth";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { migration020GrowthWhatsAppOutbound } from "../../src/core/migrations/020-growth-whatsapp-outbound";
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

function mockCloudApi(
  impl: WhatsAppCloudApiPort["sendTextMessage"]
): WhatsAppCloudApiPort & { calls: number } {
  const api = {
    calls: 0,
    async sendTextMessage(
      input: Parameters<WhatsAppCloudApiPort["sendTextMessage"]>[0]
    ) {
      api.calls += 1;
      return impl(input);
    },
    async probePhoneNumber() {
      return { ok: true as const };
    },
  };
  return api;
}

async function seedSpace(opts?: {
  accessToken?: string | null;
  enabled?: boolean;
}) {
  const messaging = createMemoryGrowthMessagingStore();
  const connections = createMemoryGrowthWhatsAppConnectionStore();
  const eventBus = createMemoryGrowthEventBus();

  const upserted = await upsertGrowthWhatsAppConnection(connections, {
    tenantId: "space-a",
    phoneNumberId: "pn-a",
    verifyToken: "verify-a",
    appSecret: "secret-a",
    ...(opts?.accessToken === null
      ? {}
      : { accessToken: opts?.accessToken ?? "token-envio-a" }),
    enabled: opts?.enabled ?? true,
    now: "2026-09-07T10:00:00.000Z",
  });
  assert.equal(upserted.ok, true);

  const ensured = await ensureGrowthConversation(messaging, {
    tenantId: "space-a",
    personaId: "persona-1",
    channel: "whatsapp",
    externalThreadId: "pn-a:56911112222",
    now: "2026-09-07T10:00:00.000Z",
  });
  assert.equal(ensured.ok, true);
  if (!ensured.ok) throw new Error("ensure failed");

  await recordGrowthInboundMessage(messaging, {
    tenantId: "space-a",
    personaId: "persona-1",
    channel: "whatsapp",
    conversationId: ensured.conversation._id,
    body: "Hola",
    externalMessageId: "wamid.in-1",
    occurredAt: "2026-09-07T12:00:00.000Z",
  });

  return {
    messaging,
    connections,
    eventBus,
    conversationId: ensured.conversation._id,
  };
}

describe("OT-GROWTH-MESSAGING-003 — ventana", () => {
  it("abre 24h desde el último inbound y parsea destinatario del hilo", () => {
    const open = evaluateWhatsAppServiceWindow({
      lastInbound: {
        _id: "m1",
        tenantId: "t",
        conversationId: "c",
        channel: "whatsapp",
        direction: "inbound",
        body: "hola",
        status: "received",
        occurredAt: "2026-09-07T12:00:00.000Z",
        createdAt: "2026-09-07T12:00:00.000Z",
      },
      now: "2026-09-08T11:59:00.000Z",
    });
    assert.equal(open.open, true);

    const closed = evaluateWhatsAppServiceWindow({
      lastInbound: {
        _id: "m1",
        tenantId: "t",
        conversationId: "c",
        channel: "whatsapp",
        direction: "inbound",
        body: "hola",
        status: "received",
        occurredAt: "2026-09-07T12:00:00.000Z",
        createdAt: "2026-09-07T12:00:00.000Z",
      },
      now: "2026-09-08T12:00:01.000Z",
    });
    assert.equal(closed.open, false);
    if (closed.open) throw new Error("expected closed");
    assert.equal(closed.reason, "window_expired");

    assert.equal(
      parseWhatsAppRecipientFromThreadId("pn-a:56911112222"),
      "56911112222"
    );
    assert.equal(parseWhatsAppRecipientFromThreadId(undefined), null);
  });
});

describe("OT-GROWTH-MESSAGING-003 — envío", () => {
  it("envía, guarda saliente y mantiene la conversación", async () => {
    const { messaging, connections, eventBus, conversationId } =
      await seedSpace();
    const cloudApi = mockCloudApi(async (input) => {
      assert.equal(input.phoneNumberId, "pn-a");
      assert.equal(input.accessToken, "token-envio-a");
      assert.equal(input.to, "56911112222");
      assert.equal(input.body, "Claro, te ayudo");
      return { ok: true, externalMessageId: "wamid.out-1" };
    });

    const result = await sendWhatsAppReply(
      { messaging, connections, cloudApi, eventBus },
      {
        tenantId: "space-a",
        conversationId,
        body: "Claro, te ayudo",
        clientRequestId: "req-1",
        now: "2026-09-07T12:30:00.000Z",
      }
    );

    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("send failed");
    assert.equal(result.duplicated, false);
    assert.equal(result.message.direction, "outbound");
    assert.equal(result.message.status, "sent");
    assert.equal(result.message.body, "Claro, te ayudo");
    assert.equal(result.message.externalMessageId, "wamid.out-1");
    assert.equal(result.message.conversationId, conversationId);
    assert.equal(result.conversation.lastMessageAt, "2026-09-07T12:30:00.000Z");
    assert.equal(result.published, true);
    assert.equal(eventBus.events.length, 1);
    assert.equal(eventBus.events[0].type, GROWTH_MESSAGE_SENT_EVENT);
    assert.equal(cloudApi.calls, 1);
  });

  it("aísla por tenant: conversación de otro Espacio no envía", async () => {
    const { messaging, connections, conversationId } = await seedSpace();
    const cloudApi = mockCloudApi(async () => ({
      ok: true,
      externalMessageId: "wamid.x",
    }));

    const result = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-b",
        conversationId,
        body: "Hola",
        now: "2026-09-07T12:30:00.000Z",
      }
    );
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected fail");
    assert.equal(result.reason, "conversation_not_found");
    assert.equal(cloudApi.calls, 0);
  });

  it("Meta rechaza: no finge enviado y conserva fallo", async () => {
    const { messaging, connections, conversationId } = await seedSpace();
    const cloudApi = mockCloudApi(async () => ({
      ok: false,
      code: "131026",
      message: "Message undeliverable",
    }));

    const result = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Reintento",
        clientRequestId: "req-fail-1",
        now: "2026-09-07T12:30:00.000Z",
      }
    );

    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected reject");
    assert.equal(result.reason, "provider_rejected");
    assert.equal(result.message.status, "failed");
    assert.equal(result.message.failureCode, "131026");
    assert.match(result.message.failureDetail ?? "", /undeliverable/i);
    assert.equal(result.message.externalMessageId, undefined);
  });

  it("reintento con mismo clientRequestId no duplica un envío exitoso", async () => {
    const { messaging, connections, conversationId } = await seedSpace();
    let seq = 0;
    const cloudApi = mockCloudApi(async () => {
      seq += 1;
      return { ok: true, externalMessageId: `wamid.out-${seq}` };
    });

    const first = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Primera",
        clientRequestId: "req-idem",
        now: "2026-09-07T12:30:00.000Z",
      }
    );
    assert.equal(first.ok, true);

    const second = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Primera otra vez",
        clientRequestId: "req-idem",
        now: "2026-09-07T12:31:00.000Z",
      }
    );
    assert.equal(second.ok, true);
    if (!second.ok || !first.ok) throw new Error("expected ok");
    assert.equal(second.duplicated, true);
    assert.equal(second.message._id, first.message._id);
    assert.equal(second.message.externalMessageId, "wamid.out-1");
    assert.equal(cloudApi.calls, 1);

    const outbound = [...messaging.messages.values()].filter(
      (m) => m.direction === "outbound"
    );
    assert.equal(outbound.length, 1);
  });

  it("reintento tras fallo reutiliza el mismo mensaje y puede enviar", async () => {
    const { messaging, connections, conversationId } = await seedSpace();
    let failOnce = true;
    const cloudApi = mockCloudApi(async () => {
      if (failOnce) {
        failOnce = false;
        return { ok: false, code: "500", message: "temporary" };
      }
      return { ok: true, externalMessageId: "wamid.out-retry" };
    });

    const failed = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Hola",
        clientRequestId: "req-retry",
        now: "2026-09-07T12:30:00.000Z",
      }
    );
    assert.equal(failed.ok, false);

    const ok = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Hola",
        clientRequestId: "req-retry",
        now: "2026-09-07T12:31:00.000Z",
      }
    );
    assert.equal(ok.ok, true);
    assert.equal(failed.ok, false);
    if (!ok.ok) throw new Error("expected ok");
    if (!failed.ok && failed.reason !== "provider_rejected") {
      throw new Error("expected provider_rejected");
    }
    if (failed.ok) throw new Error("expected failed");
    assert.equal(ok.message._id, failed.message._id);
    assert.equal(ok.message.status, "sent");
    assert.equal(ok.message.externalMessageId, "wamid.out-retry");
    assert.equal(cloudApi.calls, 2);

    const outbound = [...messaging.messages.values()].filter(
      (m) => m.direction === "outbound"
    );
    assert.equal(outbound.length, 1);
  });

  it("sin accessToken o conexión deshabilitada → connection_unavailable", async () => {
    const noToken = await seedSpace({ accessToken: null });
    const cloudApi = mockCloudApi(async () => ({
      ok: true,
      externalMessageId: "x",
    }));
    const r1 = await sendWhatsAppReply(
      {
        messaging: noToken.messaging,
        connections: noToken.connections,
        cloudApi,
      },
      {
        tenantId: "space-a",
        conversationId: noToken.conversationId,
        body: "Hola",
        now: "2026-09-07T12:30:00.000Z",
      }
    );
    assert.equal(r1.ok, false);
    if (r1.ok) throw new Error("expected unavailable");
    assert.equal(r1.reason, "connection_unavailable");

    const disabled = await seedSpace({ enabled: false });
    const r2 = await sendWhatsAppReply(
      {
        messaging: disabled.messaging,
        connections: disabled.connections,
        cloudApi,
      },
      {
        tenantId: "space-a",
        conversationId: disabled.conversationId,
        body: "Hola",
        now: "2026-09-07T12:30:00.000Z",
      }
    );
    assert.equal(r2.ok, false);
    if (r2.ok) throw new Error("expected unavailable");
    assert.equal(r2.reason, "connection_unavailable");
    assert.equal(cloudApi.calls, 0);
  });

  it("fuera de ventana: no inventa envío; registra template_required", async () => {
    const { messaging, connections, conversationId } = await seedSpace();
    const cloudApi = mockCloudApi(async () => ({
      ok: true,
      externalMessageId: "should-not",
    }));

    const result = await sendWhatsAppReply(
      { messaging, connections, cloudApi },
      {
        tenantId: "space-a",
        conversationId,
        body: "Fuera de ventana",
        clientRequestId: "req-window",
        now: "2026-09-09T12:00:00.000Z",
      }
    );
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected template");
    assert.equal(result.reason, "template_required");
    assert.equal(result.message.status, "failed");
    assert.equal(result.message.failureCode, "template_required");
    assert.equal(cloudApi.calls, 0);
  });
});

describe("OT-GROWTH-MESSAGING-003 — seguridad / frontera", () => {
  it("vista pública no expone tokens", async () => {
    const connections = createMemoryGrowthWhatsAppConnectionStore();
    const upserted = await upsertGrowthWhatsAppConnection(connections, {
      tenantId: "space-a",
      phoneNumberId: "pn-a",
      verifyToken: "verify-secreto",
      appSecret: "app-secreto",
      accessToken: "access-secreto",
    });
    assert.equal(upserted.ok, true);
    if (!upserted.ok) throw new Error("upsert failed");
    const pub = toPublicWhatsAppConnection(upserted.connection);
    assert.equal("accessToken" in pub, false);
    assert.equal("verifyToken" in pub, false);
    assert.equal("appSecret" in pub, false);
    assert.equal(pub.hasAccessToken, true);
    assert.equal(JSON.stringify(pub).includes("access-secreto"), false);
  });

  it("secretos solo servidor; API reply no loguea tokens", () => {
    const persist = readSrc("src/lib/growth/whatsapp-connections.ts");
    assert.match(persist, /accessTokenEncrypted/);
    assert.match(persist, /encryptSecret/);

    const reply = readSrc(
      "src/app/api/growth/conversaciones/[id]/reply/route.ts"
    );
    assert.match(reply, /growth\.sales\.operate/);
    assert.match(reply, /sendWhatsAppReply/);
    assert.equal(reply.includes("console.log"), false);
    assert.equal(reply.includes("NEXT_PUBLIC"), false);
    assert.equal(reply.includes("accessToken"), false);

    const send = readSrc("src/core/growth/whatsapp/send-reply.ts");
    assert.match(send, /GROWTH_MESSAGE_SENT_EVENT/);
    assert.equal(send.includes("bandeja"), false);
  });

  it("020-growth-whatsapp-outbound registrada", () => {
    assert.equal(
      MIGRATIONS.some((m) => m.id === "020-growth-whatsapp-outbound"),
      true
    );
    assert.equal(
      migration020GrowthWhatsAppOutbound.id,
      "020-growth-whatsapp-outbound"
    );
  });

  it("ensureGrowthMessagingIndexes incluye clientRequestId (si hay Mongo)", async () => {
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
        process.env.MONGODB_DB || `portal_sem_test_wa_out_${Date.now()}`
      );
      const first = await ensureGrowthMessagingIndexes(db);
      assert.ok(
        first.results.some((r) => r.name === "tenantId_clientRequestId_unique")
      );
    } finally {
      await client.close();
    }
  });
});
