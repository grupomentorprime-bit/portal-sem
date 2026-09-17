/**
 * OT-GROWTH-WHATSAPP-META-001 — Embedded Signup + aislamiento + webhook plataforma.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  completeWhatsAppEmbeddedSignup,
  createMemoryGrowthWhatsAppConnectionStore,
  createWhatsAppConnectState,
  disconnectWhatsAppConnection,
  deriveWhatsAppChannelStatus,
  getMetaPlatformPublicConfig,
  readMetaPlatformConfig,
  receiveWhatsAppCloudWebhook,
  signWhatsAppHubBody,
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
  upsertGrowthWhatsAppConnection,
  verifyWhatsAppConnectState,
  verifyWhatsAppWebhookSubscription,
  type WhatsAppCloudApiPort,
  type WhatsAppEmbeddedSignupGraphPort,
} from "../../src/core/growth/whatsapp";
import {
  createMemoryGrowthMessagingStore,
  createMemoryGrowthPersonaStore,
} from "../../src/core/growth";
import {
  GROWTH_CHANNELS_CONNECT_LABEL,
  GROWTH_CHANNELS_DISCONNECT_LABEL,
  GROWTH_CHANNELS_MANAGE_LABEL,
} from "../../src/lib/growth/labels";
import {
  buildWhatsAppEmbeddedSignupDialogQuery,
  buildWhatsAppEmbeddedSignupLoginOptions,
  describeWhatsAppEmbeddedSignupOAuthParams,
} from "../../src/lib/growth/whatsapp-embedded-signup-client";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function existsSrc(rel: string): boolean {
  return existsSync(resolve(process.cwd(), rel));
}

const PREV_ENV: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  if (!(key in PREV_ENV)) PREV_ENV[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function restoreEnv() {
  for (const [key, value] of Object.entries(PREV_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function mockGraph(opts?: {
  exchangeOk?: boolean;
  subscribeOk?: boolean;
}): WhatsAppEmbeddedSignupGraphPort & {
  exchangedCodes: string[];
  subscribedWabas: string[];
} {
  const exchangedCodes: string[] = [];
  const subscribedWabas: string[] = [];
  return {
    exchangedCodes,
    subscribedWabas,
    async exchangeCode({ code }) {
      exchangedCodes.push(code);
      if (opts?.exchangeOk === false) {
        return { ok: false, message: "exchange denied" };
      }
      return { ok: true, accessToken: "business-token-mock" };
    },
    async subscribeApps({ wabaId }) {
      subscribedWabas.push(wabaId);
      if (opts?.subscribeOk === false) {
        return { ok: false, message: "subscribe denied" };
      }
      return { ok: true };
    },
    async registerPhoneNumber() {
      return { ok: true };
    },
  };
}

function mockCloud(): WhatsAppCloudApiPort {
  return {
    async sendTextMessage() {
      return { ok: false, message: "unused" };
    },
    async probePhoneNumber() {
      return { ok: true, displayPhoneNumber: "+56 9 1111 2222" };
    },
  };
}

function cloudPayload(phoneNumberId: string, messageId: string) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-a",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "56911112222",
                phone_number_id: phoneNumberId,
              },
              contacts: [{ profile: { name: "Ana" }, wa_id: "56999998888" }],
              messages: [
                {
                  from: "56999998888",
                  id: messageId,
                  timestamp: "1757260800",
                  type: "text",
                  text: { body: "hola" },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("OT-GROWTH-WHATSAPP-META-001 — superficie", () => {
  it("reutiliza conector y webhook existentes; no crea segundo motor", () => {
    assert.equal(existsSrc("src/app/api/webhooks/whatsapp/route.ts"), true);
    assert.equal(
      existsSrc("src/app/api/admin/integrations/whatsapp/route.ts"),
      true
    );
    assert.equal(
      existsSrc("src/app/api/admin/integrations/whatsapp/meta/session/route.ts"),
      true
    );
    assert.equal(
      existsSrc(
        "src/app/api/admin/integrations/whatsapp/meta/complete/route.ts"
      ),
      true
    );
    assert.equal(
      existsSrc(
        "src/app/api/admin/integrations/whatsapp/meta/disconnect/route.ts"
      ),
      true
    );

    const webhook = readSrc("src/app/api/webhooks/whatsapp/route.ts");
    assert.match(webhook, /receiveWhatsAppCloudWebhook/);
    assert.doesNotMatch(webhook, /webhooks\/whatsapp-v2|second.?connector/i);

    const client = readSrc("src/components/admin/ChannelsSettingsClient.tsx");
    assert.match(client, /launchWhatsAppEmbeddedSignup/);
    assert.match(client, /GROWTH_CHANNELS_DISCONNECT_LABEL/);
    assert.match(client, /Configuración técnica temporal/);
  });

  it("labels humanos de conexión", () => {
    assert.equal(GROWTH_CHANNELS_CONNECT_LABEL, "Conectar WhatsApp");
    assert.equal(GROWTH_CHANNELS_MANAGE_LABEL, "Administrar");
    assert.equal(GROWTH_CHANNELS_DISCONNECT_LABEL, "Desconectar");
  });
});

describe("OT-GROWTH-WHATSAPP-META-001 — plataforma Meta", () => {
  after(() => restoreEnv());

  it("reporta no ready sin inventar valores", () => {
    setEnv("META_APP_ID", undefined);
    setEnv("META_APP_SECRET", undefined);
    setEnv("META_ES_CONFIG_ID", undefined);
    setEnv("META_WEBHOOK_VERIFY_TOKEN", undefined);
    const pub = getMetaPlatformPublicConfig(process.env);
    assert.equal(pub.ready, false);
    assert.equal(pub.appId, null);
    assert.ok(pub.missing.includes("META_APP_ID"));
    assert.equal(readMetaPlatformConfig(process.env), null);
  });

  it("ready solo con las cuatro variables de plataforma", () => {
    setEnv("META_APP_ID", "885668187811415");
    setEnv("META_APP_SECRET", "secret-platform");
    setEnv("META_ES_CONFIG_ID", "1399738671588159");
    setEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-platform");
    const cfg = readMetaPlatformConfig(process.env);
    assert.ok(cfg);
    assert.equal(cfg?.appId, "885668187811415");
    const pub = getMetaPlatformPublicConfig(process.env);
    assert.equal(pub.ready, true);
    assert.equal(pub.appId, "885668187811415");
    assert.equal(pub.esConfigId, "1399738671588159");
    assert.doesNotMatch(JSON.stringify(pub), /secret-platform|verify-platform/);
  });

  it("tolera comillas envolventes y rechaza config_id no numérico", () => {
    setEnv("META_APP_ID", '"885668187811415"');
    setEnv("META_APP_SECRET", "'secret-platform'");
    setEnv("META_ES_CONFIG_ID", '"1399738671588159"');
    setEnv("META_WEBHOOK_VERIFY_TOKEN", '"verify-platform"');
    const pub = getMetaPlatformPublicConfig(process.env);
    assert.equal(pub.ready, true);
    assert.equal(pub.appId, "885668187811415");
    assert.equal(pub.esConfigId, "1399738671588159");

    setEnv("META_ES_CONFIG_ID", "configurado");
    const bad = getMetaPlatformPublicConfig(process.env);
    assert.equal(bad.ready, false);
    assert.ok(bad.missing.includes("META_ES_CONFIG_ID"));
  });
});

describe("OT-GROWTH-WHATSAPP-META-001 — state", () => {
  before(() => {
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = "test-session-secret-whatsapp-meta-001";
    }
  });

  it("firma y valida state por Espacio", () => {
    const state = createWhatsAppConnectState("tenant-a");
    const ok = verifyWhatsAppConnectState(state, {
      expectedTenantId: "tenant-a",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.tenantId, "tenant-a");
  });

  it("rechaza state de otro Espacio o manipulado", () => {
    const state = createWhatsAppConnectState("tenant-a");
    const mismatch = verifyWhatsAppConnectState(state, {
      expectedTenantId: "tenant-b",
    });
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) assert.equal(mismatch.reason, "tenant_mismatch");

    const tampered = `${state.slice(0, -4)}xxxx`;
    const bad = verifyWhatsAppConnectState(tampered, {
      expectedTenantId: "tenant-a",
    });
    assert.equal(bad.ok, false);
  });

  it("rechaza state expirado", () => {
    const issuedAt = Date.now() - 20 * 60 * 1000;
    const state = createWhatsAppConnectState("tenant-a", { now: issuedAt });
    const expired = verifyWhatsAppConnectState(state, {
      expectedTenantId: "tenant-a",
      now: Date.now(),
    });
    assert.equal(expired.ok, false);
    if (!expired.ok) assert.equal(expired.reason, "expired");
  });
});

describe("OT-GROWTH-WHATSAPP-META-001 — complete + aislamiento", () => {
  before(() => {
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = "test-session-secret-whatsapp-meta-001";
    }
  });

  it("completa Embedded Signup con mocks y no expone secretos", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const graph = mockGraph();
    const state = createWhatsAppConnectState("space-a");

    const result = await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state,
        code: "auth-code-1",
        phoneNumberId: "pn-a",
        wabaId: "waba-a",
        businessId: "biz-a",
      },
      {
        platform: {
          appId: "app",
          appSecret: "platform-secret",
          esConfigId: "cfg",
          webhookVerifyToken: "platform-verify",
        },
        graph,
        cloudApi: mockCloud(),
      }
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.connection.tenantId, "space-a");
    assert.equal(result.connection.phoneNumberId, "pn-a");
    assert.equal(result.connection.accessToken, "business-token-mock");
    assert.equal(result.connection.connectionSource, "embedded_signup");
    assert.equal(result.connection.appSecret, "");
    assert.equal(result.connection.verifyToken, "");
    assert.equal(result.connection.displayPhoneNumber, "+56 9 1111 2222");
    assert.deepEqual(graph.exchangedCodes, ["auth-code-1"]);
    assert.deepEqual(graph.subscribedWabas, ["waba-a"]);

    const pub = toPublicWhatsAppConnection(result.connection);
    assert.equal(pub.hasAccessToken, true);
    assert.equal(pub.hasAppSecret, false);
    assert.doesNotMatch(JSON.stringify(pub), /business-token|platform-secret/);

    const view = toWhatsAppChannelAdminView(pub);
    assert.equal(view.status, "connected");
    assert.equal(view.statusLabel, "Conectado");
    assert.equal(view.viaEmbeddedSignup, true);
    assert.equal(view.displayPhoneNumber, "+56 9 1111 2222");
  });

  it("aisla phone_number_id entre Espacios", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const platform = {
      appId: "app",
      appSecret: "platform-secret",
      esConfigId: "cfg",
      webhookVerifyToken: "platform-verify",
    };

    const first = await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state: createWhatsAppConnectState("space-a"),
        code: "code-a",
        phoneNumberId: "pn-shared",
        wabaId: "waba-a",
      },
      { platform, graph: mockGraph(), cloudApi: mockCloud() }
    );
    assert.equal(first.ok, true);

    const second = await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-b",
        state: createWhatsAppConnectState("space-b"),
        code: "code-b",
        phoneNumberId: "pn-shared",
        wabaId: "waba-b",
      },
      { platform, graph: mockGraph(), cloudApi: mockCloud() }
    );
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.reason, "phone_number_in_use");

    const a = await store.findByTenantId("space-a");
    const b = await store.findByTenantId("space-b");
    assert.ok(a);
    assert.equal(b, null);
  });

  it("rechaza state inválido y ausencia de Meta", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const noMeta = await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state: createWhatsAppConnectState("space-a"),
        code: "x",
        phoneNumberId: "pn",
        wabaId: "waba",
      },
      { platform: null }
    );
    assert.equal(noMeta.ok, false);
    if (!noMeta.ok) assert.equal(noMeta.reason, "meta_not_configured");

    const badState = await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state: "not-a-state",
        code: "x",
        phoneNumberId: "pn",
        wabaId: "waba",
      },
      {
        platform: {
          appId: "a",
          appSecret: "s",
          esConfigId: "c",
          webhookVerifyToken: "v",
        },
        graph: mockGraph(),
      }
    );
    assert.equal(badState.ok, false);
    if (!badState.ok) assert.equal(badState.reason, "invalid_state");
  });

  it("desconecta solo el Espacio actual", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const platform = {
      appId: "app",
      appSecret: "s",
      esConfigId: "c",
      webhookVerifyToken: "v",
    };
    await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state: createWhatsAppConnectState("space-a"),
        code: "c1",
        phoneNumberId: "pn-a",
        wabaId: "waba-a",
      },
      { platform, graph: mockGraph(), cloudApi: mockCloud() }
    );
    await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-b",
        state: createWhatsAppConnectState("space-b"),
        code: "c2",
        phoneNumberId: "pn-b",
        wabaId: "waba-b",
      },
      { platform, graph: mockGraph(), cloudApi: mockCloud() }
    );

    const removed = await disconnectWhatsAppConnection(store, "space-a");
    assert.equal(removed.ok, true);
    assert.equal(await store.findByTenantId("space-a"), null);
    assert.ok(await store.findByTenantId("space-b"));
  });
});

describe("OT-GROWTH-WHATSAPP-META-001 — webhook plataforma + legacy", () => {
  it("acepta verify token de plataforma", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const ok = await verifyWhatsAppWebhookSubscription(
      store,
      {
        mode: "subscribe",
        token: "platform-verify",
        challenge: "challenge-1",
      },
      { platformVerifyToken: "platform-verify" }
    );
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.challenge, "challenge-1");
  });

  it("mantiene verify legacy por conexión", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    await upsertGrowthWhatsAppConnection(store, {
      tenantId: "legacy",
      phoneNumberId: "pn-legacy",
      verifyToken: "legacy-verify",
      appSecret: "legacy-secret",
      accessToken: "legacy-token",
    });
    const ok = await verifyWhatsAppWebhookSubscription(
      store,
      {
        mode: "subscribe",
        token: "legacy-verify",
        challenge: "c2",
      },
      { platformVerifyToken: null }
    );
    assert.equal(ok.ok, true);
  });

  it("firma POST con App Secret de plataforma para ES", async () => {
    const store = createMemoryGrowthWhatsAppConnectionStore();
    const platform = {
      appId: "app",
      appSecret: "platform-secret",
      esConfigId: "c",
      webhookVerifyToken: "v",
    };
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = "test-session-secret-whatsapp-meta-001";
    }
    await completeWhatsAppEmbeddedSignup(
      store,
      {
        tenantId: "space-a",
        state: createWhatsAppConnectState("space-a"),
        code: "c1",
        phoneNumberId: "pn-a",
        wabaId: "waba-a",
      },
      { platform, graph: mockGraph(), cloudApi: mockCloud() }
    );

    const payload = cloudPayload("pn-a", "wamid-1");
    const rawBody = JSON.stringify(payload);
    const signature = signWhatsAppHubBody(rawBody, "platform-secret");

    const result = await receiveWhatsAppCloudWebhook(
      {
        connections: store,
        personas: createMemoryGrowthPersonaStore(),
        messaging: createMemoryGrowthMessagingStore(),
        platformAppSecret: "platform-secret",
      },
      { rawBody, signatureHeader: signature }
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.processed.length, 1);
      assert.equal(result.processed[0].tenantId, "space-a");
    }
  });

  it("estado canal ES sin secretos por Espacio", () => {
    assert.equal(
      deriveWhatsAppChannelStatus({
        tenantId: "t",
        phoneNumberId: "pn",
        enabled: true,
        connectionSource: "embedded_signup",
        hasVerifyToken: false,
        hasAppSecret: false,
        hasAccessToken: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        displayPhoneNumber: "+56 9 0000 0000",
      }),
      "connected"
    );
  });
});

describe("OT-GROWTH-WHATSAPP-META-001 — CSP Meta", () => {
  it("permite SDK y dominios Facebook en CSP", () => {
    const headers = readSrc("src/core/security/http-headers.ts");
    assert.match(headers, /connect\.facebook\.net/);
    assert.match(headers, /graph\.facebook\.com/);
    assert.match(headers, /www\.facebook\.com/);
  });

  it("documenta variables META_* en .env.example sin valores", () => {
    const env = readSrc(".env.example");
    assert.match(env, /META_APP_ID=/);
    assert.match(env, /META_APP_SECRET=/);
    assert.match(env, /META_ES_CONFIG_ID=/);
    assert.match(env, /META_WEBHOOK_VERIFY_TOKEN=/);
    assert.doesNotMatch(env, /META_APP_SECRET=\S+/);
  });
});

describe("OT-GROWTH-WHATSAPP-EMBEDDED-SIGNUP-OAUTH-FIX-001 — inicio OAuth", () => {
  it("FB.login usa config_id + code y nunca scope=openid", () => {
    const client = readSrc("src/lib/growth/whatsapp-embedded-signup-client.ts");
    assert.match(client, /buildWhatsAppEmbeddedSignupLoginOptions/);
    assert.match(client, /describeWhatsAppEmbeddedSignupOAuthParams/);
    assert.match(client, /buildWhatsAppEmbeddedSignupDialogQuery/);
    assert.match(client, /launchWhatsAppEmbeddedSignupReady/);
    assert.match(client, /response_type:\s*"code"/);
    assert.match(client, /override_default_response_type:\s*true/);
    assert.match(client, /config_id:/);
    assert.match(client, /v26\.0/);
    assert.doesNotMatch(client, /scope:\s*["']openid/);
    assert.doesNotMatch(client, /scope:\s*["']whatsapp/);
    assert.match(
      client,
      /Nunca scope=openid|no incluir scope ni openid|No usa scope/
    );

    const options = buildWhatsAppEmbeddedSignupLoginOptions("1399738671588159");
    assert.ok(options);
    assert.equal(options?.config_id, "1399738671588159");
    assert.equal(options?.response_type, "code");
    assert.equal(options?.override_default_response_type, true);
    assert.equal(
      Object.prototype.hasOwnProperty.call(options, "scope"),
      false
    );

    const oauth = describeWhatsAppEmbeddedSignupOAuthParams({
      appId: "885668187811415",
      esConfigId: "1399738671588159",
    });
    assert.ok(oauth);
    assert.equal(oauth?.client_id, "885668187811415");
    assert.equal(oauth?.config_id, "1399738671588159");
    assert.equal(oauth?.response_type, "code");
    assert.equal(oauth?.scope, null);

    assert.equal(buildWhatsAppEmbeddedSignupLoginOptions("openid"), null);
    assert.equal(
      describeWhatsAppEmbeddedSignupOAuthParams({
        appId: "885668187811415",
        esConfigId: "",
      }),
      null
    );
  });

  it("dialog query efectiva incluye config_id=code y excluye openid", () => {
    const query = buildWhatsAppEmbeddedSignupDialogQuery({
      appId: "885668187811415",
      esConfigId: "1399738671588159",
    });
    assert.ok(query);
    assert.match(query!, /config_id=1399738671588159/);
    assert.match(query!, /response_type=code/);
    assert.match(query!, /client_id=885668187811415/);
    assert.match(query!, /override_default_response_type=true/);
    assert.doesNotMatch(query!, /scope=/);
    assert.doesNotMatch(query!, /openid/);
    assert.doesNotMatch(query!, /response_type=token/);
  });

  it("ChannelsSettingsClient valida App ID / Config ID y lanza FB.login sync", () => {
    const client = readSrc("src/components/admin/ChannelsSettingsClient.tsx");
    assert.match(client, /\\d\{5,\}/);
    assert.match(client, /launchWhatsAppEmbeddedSignupReady/);
    assert.match(client, /isFacebookSdkReady/);
    assert.match(client, /loadFacebookSdk/);
    assert.doesNotMatch(
      client,
      /await\s+fetch\([\s\S]{0,200}launchWhatsAppEmbeddedSignupReady/
    );
  });
});
