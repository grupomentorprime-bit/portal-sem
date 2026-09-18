/**
 * OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 —
 * Handshake GET Meta (hub.challenge) + POST firma intacta.
 */

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import {
  createMemoryGrowthEventBus,
  createMemoryGrowthMessagingStore,
  createMemoryGrowthPersonaStore,
  createMemoryGrowthWhatsAppConnectionStore,
  receiveWhatsAppCloudWebhook,
  signWhatsAppHubBody,
  upsertGrowthWhatsAppConnection,
  verifyWhatsAppWebhookSubscription,
} from "../../src/core/growth";
import { getMetaAppSecret, getMetaWebhookVerifyToken } from "../../src/core/growth/whatsapp/meta-platform";
import { proxy } from "../../src/proxy";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const envSnapshot = new Map<string, string | undefined>();

function setEnv(key: string, value: string | undefined): void {
  if (!envSnapshot.has(key)) {
    envSnapshot.set(key, process.env[key]);
  }
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function restoreEnv(): void {
  for (const [key, value] of envSnapshot) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  envSnapshot.clear();
}

async function simulateWebhookGet(url: string): Promise<Response> {
  const parsed = new URL(url, "https://growthos.example/api/webhooks/whatsapp");
  const query = {
    mode: parsed.searchParams.get("hub.mode"),
    token: parsed.searchParams.get("hub.verify_token"),
    challenge: parsed.searchParams.get("hub.challenge"),
  };

  // Mismo contrato que route.ts GET: plataforma sin store; legacy solo si hace falta.
  const platformResult = await verifyWhatsAppWebhookSubscription(null, query);
  if (platformResult.ok) {
    return new Response(platformResult.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (
    platformResult.reason === "invalid_mode" ||
    platformResult.reason === "missing_token_or_challenge"
  ) {
    return new Response(null, { status: 403 });
  }

  const store = createMemoryGrowthWhatsAppConnectionStore();
  const result = await verifyWhatsAppWebhookSubscription(store, query);
  if (!result.ok) return new Response(null, { status: 403 });
  return new Response(result.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

describe("OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — handshake GET", () => {
  after(() => restoreEnv());

  it("GET token correcto → 200 + challenge exacto (sin store)", async () => {
    setEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-platform-ok");
    const challenge = "1158201444";
    const res = await simulateWebhookGet(
      `?hub.mode=subscribe&hub.verify_token=verify-platform-ok&hub.challenge=${challenge}`
    );
    assert.equal(res.status, 200);
    assert.equal(await res.text(), challenge);
    assert.match(
      res.headers.get("content-type") ?? "",
      /^text\/plain/
    );
  });

  it("GET token incorrecto → 403", async () => {
    setEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-platform-ok");
    const res = await simulateWebhookGet(
      "?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=99"
    );
    assert.equal(res.status, 403);
  });

  it("GET sin parámetros → rechazo controlado 403", async () => {
    setEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-platform-ok");
    const res = await simulateWebhookGet("");
    assert.equal(res.status, 403);
  });

  it("lee META_WEBHOOK_VERIFY_TOKEN y tolera comillas envolventes", () => {
    setEnv("META_WEBHOOK_VERIFY_TOKEN", '"quoted-token"');
    assert.equal(getMetaWebhookVerifyToken(), "quoted-token");
    setEnv("META_WEBHOOK_VERIFY_TOKEN", "plain-token");
    assert.equal(getMetaWebhookVerifyToken(), "plain-token");
  });

  it("lee META_APP_SECRET y tolera comillas envolventes", () => {
    setEnv("META_APP_SECRET", "'quoted-secret'");
    assert.equal(getMetaAppSecret(), "quoted-secret");
    setEnv("META_APP_SECRET", "plain-secret");
    assert.equal(getMetaAppSecret(), "plain-secret");
  });
});

describe("OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — POST seguridad", () => {
  it("POST conserva validación de firma (sin firma → 403)", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    await upsertGrowthWhatsAppConnection(store, {
      tenantId: "space-a",
      phoneNumberId: "pn-a",
      verifyToken: "legacy",
      appSecret: "app-secret-a",
      accessToken: "tok-a",
    });

    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "pn-a" },
                messages: [
                  {
                    from: "56911112222",
                    id: "wamid.1",
                    timestamp: "1710000000",
                    type: "text",
                    text: { body: "hola" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    const noSig = await receiveWhatsAppCloudWebhook(
      {
        connections: store,
        personas: createMemoryGrowthPersonaStore(),
        messaging: createMemoryGrowthMessagingStore(),
        eventBus: createMemoryGrowthEventBus(),
        platformAppSecret: "platform-secret",
      },
      { rawBody, signatureHeader: null }
    );
    assert.equal(noSig.ok, false);
    if (!noSig.ok) {
      assert.equal(noSig.httpStatus, 403);
      assert.equal(noSig.reason, "invalid_signature");
    }

    const badSig = await receiveWhatsAppCloudWebhook(
      {
        connections: store,
        personas: createMemoryGrowthPersonaStore(),
        messaging: createMemoryGrowthMessagingStore(),
        eventBus: createMemoryGrowthEventBus(),
        platformAppSecret: "platform-secret",
      },
      { rawBody, signatureHeader: "sha256=deadbeef" }
    );
    assert.equal(badSig.ok, false);
    if (!badSig.ok) assert.equal(badSig.httpStatus, 403);

    const goodSig = signWhatsAppHubBody(rawBody, "platform-secret");
    const ok = await receiveWhatsAppCloudWebhook(
      {
        connections: store,
        personas: createMemoryGrowthPersonaStore(),
        messaging: createMemoryGrowthMessagingStore(),
        eventBus: createMemoryGrowthEventBus(),
        platformAppSecret: "platform-secret",
      },
      { rawBody, signatureHeader: goodSig }
    );
    assert.equal(ok.ok, true);
  });
});

describe("OT-GROWTH-WHATSAPP-WEBHOOK-VERIFY-FIX-001 — frontera pública", () => {
  it("proxy no exige sesión en /api/webhooks/whatsapp", () => {
    const res = proxy(
      new NextRequest(
        new URL("https://growthos.mentorprime.cl/api/webhooks/whatsapp?hub.mode=subscribe"),
        { headers: { host: "growthos.mentorprime.cl" } }
      )
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("location"), null);
  });

  it("GET de ruta usa verify sin abrir store en camino plataforma", () => {
    const webhook = readSrc("src/app/api/webhooks/whatsapp/route.ts");
    assert.match(webhook, /verifyWhatsAppWebhookSubscription\(null,\s*query\)/);
    assert.match(webhook, /hub\.verify_token/);
    assert.match(webhook, /hub\.challenge/);
    assert.match(webhook, /x-hub-signature-256/);
    assert.doesNotMatch(webhook, /requireAuth|requireSession/);
  });

  it("proxy excluye explícitamente /api/webhooks/", () => {
    const src = readSrc("src/proxy.ts");
    assert.match(src, /\/api\/webhooks\//);
  });
});
