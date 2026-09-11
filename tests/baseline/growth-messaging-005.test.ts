/**
 * OT-GROWTH-MESSAGING-005 — Ajustes → Canales (WhatsApp existente).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createMemoryGrowthWhatsAppConnectionStore,
  deriveWhatsAppChannelStatus,
  testGrowthWhatsAppConnection,
  toPublicWhatsAppConnection,
  toWhatsAppChannelAdminView,
  upsertGrowthWhatsAppConnection,
  type WhatsAppCloudApiPort,
} from "../../src/core/growth/whatsapp";
import {
  GROWTH_CHANNELS_CAN_REPLY_LABEL,
  GROWTH_CHANNELS_COMING_SOON,
  GROWTH_CHANNELS_COMPLETE_CONNECTION_LABEL,
  GROWTH_CHANNELS_CONNECT_LABEL,
  GROWTH_CHANNELS_MANAGE_LABEL,
  GROWTH_CHANNELS_PAGE_TITLE,
  GROWTH_CHANNELS_PAUSE_LABEL,
  GROWTH_CHANNELS_RECEIVES_LABEL,
  GROWTH_CHANNELS_RESUME_LABEL,
  GROWTH_CHANNELS_TEST_FAIL,
  GROWTH_CHANNELS_TEST_LABEL,
  GROWTH_CHANNELS_TEST_OK,
  GROWTH_CHANNELS_VIEW_MESSAGES_LABEL,
  GROWTH_CHANNELS_WHATSAPP_LABEL,
} from "../../src/lib/growth/labels";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function existsSrc(rel: string): boolean {
  return existsSync(resolve(process.cwd(), rel));
}

function mockProbe(
  result: Awaited<ReturnType<WhatsAppCloudApiPort["probePhoneNumber"]>>
): WhatsAppCloudApiPort {
  return {
    async sendTextMessage() {
      return { ok: false, message: "unused" };
    },
    async probePhoneNumber() {
      return result;
    },
  };
}

async function seedConnection(opts?: {
  accessToken?: string | null;
  enabled?: boolean;
  displayPhoneNumber?: string;
}) {
  const store = createMemoryGrowthWhatsAppConnectionStore();
  const upserted = await upsertGrowthWhatsAppConnection(store, {
    tenantId: "space-a",
    phoneNumberId: "pn-a",
    verifyToken: "verify-a",
    appSecret: "secret-a",
    displayPhoneNumber: opts?.displayPhoneNumber ?? "+56 9 1111 2222",
    ...(opts?.accessToken === null
      ? {}
      : { accessToken: opts?.accessToken ?? "token-a" }),
    enabled: opts?.enabled ?? true,
  });
  assert.equal(upserted.ok, true);
  if (!upserted.ok) throw new Error("upsert failed");
  return { store, connection: upserted.connection };
}

describe("OT-GROWTH-MESSAGING-005 — superficie", () => {
  it("expone ruta Canales, cliente y endpoint de prueba", () => {
    assert.equal(existsSrc("src/app/admin/settings/channels/page.tsx"), true);
    assert.equal(
      existsSrc("src/components/admin/ChannelsSettingsClient.tsx"),
      true
    );
    assert.equal(
      existsSrc("src/app/api/admin/integrations/whatsapp/test/route.ts"),
      true
    );

    const page = readSrc("src/app/admin/settings/channels/page.tsx");
    assert.match(page, /settings\.integrations/);
    assert.match(page, /ChannelsSettingsClient/);
    assert.doesNotMatch(page, /mensajes-read|MensajesInboxClient/);
  });

  it("activa Canales en Ajustes con permiso de integraciones", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(
      nav,
      /id: "config-channels"[\s\S]*?href: "\/admin\/settings\/channels"/
    );
    assert.match(
      nav,
      /href: "\/admin\/settings\/channels"[\s\S]*?requiredAnyPermission: \["settings\.integrations"\]/
    );
    assert.match(nav, /label: "Integraciones"/);
    assert.match(nav, /href: "\/admin\/settings\/integrations"/);
  });
});

describe("OT-GROWTH-MESSAGING-005 — estados humanos", () => {
  it("deriva No conectado / Incompleto / Pausado / Conectado", async () => {
    assert.equal(deriveWhatsAppChannelStatus(null), "not_connected");

    const incomplete = await seedConnection({ accessToken: null });
    const pubIncomplete = toPublicWhatsAppConnection(incomplete.connection);
    assert.equal(deriveWhatsAppChannelStatus(pubIncomplete), "incomplete");

    const paused = await seedConnection({ enabled: false });
    const pubPaused = toPublicWhatsAppConnection(paused.connection);
    assert.equal(deriveWhatsAppChannelStatus(pubPaused), "paused");

    const connected = await seedConnection();
    const pubConnected = toPublicWhatsAppConnection(connected.connection);
    assert.equal(deriveWhatsAppChannelStatus(pubConnected), "connected");
  });

  it("vista de canal no expone secretos ni IDs técnicos", async () => {
    const { connection } = await seedConnection({
      accessToken: "access-secreto-xyz",
    });
    const view = toWhatsAppChannelAdminView(
      toPublicWhatsAppConnection(connection)
    );
    const json = JSON.stringify(view);
    assert.equal(view.status, "connected");
    assert.equal(view.statusLabel, "Conectado");
    assert.equal(view.displayPhoneNumber, "+56 9 1111 2222");
    assert.equal(view.receivesMessages, true);
    assert.equal(view.canReplyFromMensajes, true);
    assert.equal(json.includes("access-secreto-xyz"), false);
    assert.equal(json.includes("verify-a"), false);
    assert.equal(json.includes("secret-a"), false);
    assert.equal(json.includes("pn-a"), false);
    assert.equal("phoneNumberId" in view, false);
    assert.equal("wabaId" in view, false);
    assert.equal("accessToken" in view, false);
  });

  it("pausado no recibe ni responde; incompleto no responde", async () => {
    const paused = await seedConnection({ enabled: false });
    const pausedView = toWhatsAppChannelAdminView(
      toPublicWhatsAppConnection(paused.connection)
    );
    assert.equal(pausedView.receivesMessages, false);
    assert.equal(pausedView.canReplyFromMensajes, false);

    const incomplete = await seedConnection({ accessToken: null });
    const incompleteView = toWhatsAppChannelAdminView(
      toPublicWhatsAppConnection(incomplete.connection)
    );
    assert.equal(incompleteView.status, "incomplete");
    assert.equal(incompleteView.canReplyFromMensajes, false);
  });
});

describe("OT-GROWTH-MESSAGING-005 — probar conexión", () => {
  it("correcta / fallida / incompleta / sin configuración", async () => {
    const okSeed = await seedConnection();
    const ok = await testGrowthWhatsAppConnection(
      okSeed.store,
      { tenantId: "space-a" },
      mockProbe({ ok: true, displayPhoneNumber: "+56911112222" })
    );
    assert.equal(ok.ok, true);

    const fail = await testGrowthWhatsAppConnection(
      okSeed.store,
      { tenantId: "space-a" },
      mockProbe({ ok: false, message: "Invalid OAuth access token" })
    );
    assert.equal(fail.ok, false);
    if (fail.ok) throw new Error("expected fail");
    assert.equal(fail.reason, "provider_rejected");

    const incomplete = await seedConnection({ accessToken: null });
    const incompleteResult = await testGrowthWhatsAppConnection(
      incomplete.store,
      { tenantId: "space-a" },
      mockProbe({ ok: true })
    );
    assert.equal(incompleteResult.ok, false);
    if (incompleteResult.ok) throw new Error("expected incomplete");
    assert.equal(incompleteResult.reason, "incomplete");

    const empty = createMemoryGrowthWhatsAppConnectionStore();
    const missing = await testGrowthWhatsAppConnection(empty, {
      tenantId: "space-a",
    });
    assert.equal(missing.ok, false);
    if (missing.ok) throw new Error("expected missing");
    assert.equal(missing.reason, "not_configured");
  });

  it("aisla por Espacio", async () => {
    const a = await seedConnection();
    const b = createMemoryGrowthWhatsAppConnectionStore();
    await upsertGrowthWhatsAppConnection(b, {
      tenantId: "space-b",
      phoneNumberId: "pn-b",
      verifyToken: "v-b",
      appSecret: "s-b",
      accessToken: "t-b",
    });

    const cross = await testGrowthWhatsAppConnection(
      a.store,
      { tenantId: "space-b" },
      mockProbe({ ok: true })
    );
    assert.equal(cross.ok, false);
    if (cross.ok) throw new Error("expected isolation");
    assert.equal(cross.reason, "not_configured");
  });

  it("endpoint de prueba no expone Meta; mensajes humanos", () => {
    const route = readSrc(
      "src/app/api/admin/integrations/whatsapp/test/route.ts"
    );
    assert.match(route, /settings\.integrations/);
    assert.match(route, /testGrowthWhatsAppConnection/);
    assert.match(route, /Conexión correcta/);
    assert.match(route, /No pudimos conectar\. Revisa la configuración\./);
    assert.doesNotMatch(route, /Invalid OAuth|graph\.facebook|error\.message/);
    assert.equal(route.includes("accessToken"), false);
  });
});

describe("OT-GROWTH-MESSAGING-005 — UI humana", () => {
  it("muestra estados, acciones y futuros sin fingir conexión", () => {
    const ui = readSrc("src/components/admin/ChannelsSettingsClient.tsx");
    assert.match(ui, /data-channels-settings/);
    assert.match(ui, /data-channel="whatsapp"/);
    assert.match(ui, /GROWTH_CHANNELS_VIEW_MESSAGES_LABEL/);
    assert.match(ui, /GROWTH_CHANNELS_TEST_LABEL/);
    assert.match(ui, /GROWTH_CHANNELS_PAUSE_LABEL/);
    assert.match(ui, /GROWTH_CHANNELS_RESUME_LABEL/);
    assert.match(ui, /GROWTH_CHANNELS_COMING_SOON/);
    assert.match(ui, /Instagram/);
    assert.match(ui, /Facebook/);
    assert.match(ui, /Chat del sitio/);
    assert.match(ui, /Correo/);
    assert.match(ui, /href="\/admin\/mensajes"/);

    assert.equal(GROWTH_CHANNELS_PAGE_TITLE, "Canales");
    assert.equal(GROWTH_CHANNELS_WHATSAPP_LABEL, "WhatsApp");
    assert.equal(GROWTH_CHANNELS_CONNECT_LABEL, "Conectar");
    assert.equal(
      GROWTH_CHANNELS_COMPLETE_CONNECTION_LABEL,
      "Completar conexión"
    );
    assert.equal(GROWTH_CHANNELS_MANAGE_LABEL, "Administrar");
    assert.equal(GROWTH_CHANNELS_TEST_LABEL, "Probar conexión");
    assert.equal(GROWTH_CHANNELS_PAUSE_LABEL, "Pausar");
    assert.equal(GROWTH_CHANNELS_RESUME_LABEL, "Reanudar");
    assert.equal(GROWTH_CHANNELS_VIEW_MESSAGES_LABEL, "Ver mensajes");
    assert.equal(GROWTH_CHANNELS_RECEIVES_LABEL, "Recibe mensajes");
    assert.equal(
      GROWTH_CHANNELS_CAN_REPLY_LABEL,
      "Puedes responder desde Mensajes"
    );
    assert.equal(GROWTH_CHANNELS_TEST_OK, "Conexión correcta");
    assert.equal(
      GROWTH_CHANNELS_TEST_FAIL,
      "No pudimos conectar. Revisa la configuración."
    );
    assert.equal(GROWTH_CHANNELS_COMING_SOON, "Disponible más adelante");

    for (const banned of [
      "wamid",
      "webhook",
      "WABA",
      "phone_number_id",
      "accessTokenEncrypted",
      "appSecretEncrypted",
    ]) {
      assert.doesNotMatch(ui, new RegExp(banned, "i"));
    }

    // Formulario de Conectar pide identificador; la ficha solo muestra número visible.
    assert.match(ui, /Identificador del número/);
    assert.match(ui, /data-channel-phone/);
    assert.doesNotMatch(ui, /data-channel-waba|data-channel-phone-id/);
  });

  it("reutiliza PUT WhatsApp y no toca bandeja Mensajes", () => {
    const ui = readSrc("src/components/admin/ChannelsSettingsClient.tsx");
    assert.match(ui, /\/api\/admin\/integrations\/whatsapp/);
    assert.match(ui, /\/api\/admin\/integrations\/whatsapp\/test/);
    assert.doesNotMatch(ui, /MensajesInboxClient|growth_conversaciones/);

    const mensajes = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.doesNotMatch(mensajes, /settings\/channels|ChannelsSettings/);
  });

  it("pausar/reanudar usa enabled vía PUT", () => {
    const ui = readSrc("src/components/admin/ChannelsSettingsClient.tsx");
    assert.match(ui, /enabled:\s*nextEnabled/);
    assert.match(ui, /method:\s*"PUT"/);
  });
});
