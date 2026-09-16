/**
 * OT-GROWTH-MESSAGING-004 — bandeja /admin/mensajes.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatMensajeWhen,
  growthConversationChannelLabel,
  isOutboundSendFailed,
  truncateMessagePreview,
} from "../../src/lib/growth/mensajes-view";
import {
  GROWTH_MENSAJES_PAGE_TITLE,
  GROWTH_MENSAJES_REPLY_PLACEHOLDER,
  GROWTH_MENSAJES_SEND_LABEL,
  GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL,
  GROWTH_MENSAJES_VIEW_PERSONA_LABEL,
} from "../../src/lib/growth/labels";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function existsSrc(rel: string): boolean {
  return existsSync(resolve(process.cwd(), rel));
}

describe("OT-GROWTH-MESSAGING-004 — superficie", () => {
  it("expone página, cliente y lectura sin segundo motor", () => {
    assert.equal(existsSrc("src/app/admin/mensajes/page.tsx"), true);
    assert.equal(
      existsSrc("src/components/admin/growth/MensajesInboxClient.tsx"),
      true
    );
    assert.equal(existsSrc("src/lib/growth/mensajes-read.ts"), true);
    assert.equal(existsSrc("src/lib/growth/mensajes-view.ts"), true);

    const page = readSrc("src/app/admin/mensajes/page.tsx");
    assert.match(page, /listGrowthMensajesInbox/);
    assert.match(page, /getGrowthMensajesThread/);
    assert.match(page, /MensajesInboxClient/);
    assert.match(page, /growth\.sales\.read/);
    assert.match(page, /growth\.sales\.operate/);
    assert.doesNotMatch(page, /sendWhatsAppReply|wamid|webhook/i);
  });

  it("activa Mensajes en la navegación productiva", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(nav, /id: "nav-mensajes"[\s\S]*?href: "\/admin\/mensajes"/);
    assert.match(
      nav,
      /matchPrefixes: \["\/admin\/mensajes"\]/
    );
  });
});

describe("OT-GROWTH-MESSAGING-004 — UI humana", () => {
  it("muestra nombre, canal, preview, chat y respuesta; sin jerga de proveedor", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /personaName/);
    assert.match(ui, /channelLabel/);
    assert.match(ui, /lastMessagePreview/);
    assert.match(ui, /GROWTH_MENSAJES_REPLY_PLACEHOLDER/);
    assert.match(ui, /GROWTH_MENSAJES_SEND_LABEL/);
    assert.match(ui, /GROWTH_MENSAJES_VIEW_PERSONA_LABEL/);
    assert.match(ui, /GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL/);
    assert.match(ui, /data-mensajes-inbox/);
    assert.match(ui, /md:grid-cols-/);
    assert.match(ui, /hidden md:flex|md:hidden/);

    assert.equal(GROWTH_MENSAJES_PAGE_TITLE, "Mensajes");
    assert.equal(GROWTH_MENSAJES_REPLY_PLACEHOLDER, "Escribe una respuesta…");
    assert.equal(GROWTH_MENSAJES_SEND_LABEL, "Enviar");
    assert.equal(GROWTH_MENSAJES_VIEW_PERSONA_LABEL, "Ver persona");
    assert.equal(GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL, "Ver oportunidad");

    for (const banned of [
      "wamid",
      "WABA",
      "webhook",
      "accessToken",
      "verifyToken",
      "phone_number_id",
      "externalMessageId",
      "externalThreadId",
      "failureCode",
    ]) {
      assert.doesNotMatch(ui, new RegExp(banned));
    }
  });

  it("responde reutilizando el endpoint de MESSAGING-003", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(
      ui,
      /\/api\/growth\/conversaciones\/\$\{encodeURIComponent\(thread\.id\)\}\/reply/
    );
    assert.doesNotMatch(ui, /sendWhatsAppReply/);
  });

  it("solo ofrece Ver oportunidad cuando el hilo trae vínculo real", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /thread\.oportunidadId && thread\.opportunity/);
    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.match(read, /createMongoGrowthOpportunityStore/);
    assert.match(read, /oportunidades\.findById\(tenantId, conversation\.oportunidadId\)/);
    assert.match(read, /oportunidadId/);
  });
});

describe("OT-GROWTH-MESSAGING-004 — proyección", () => {
  it("formatea canal, hora y preview útiles", () => {
    assert.equal(growthConversationChannelLabel("whatsapp"), "WhatsApp");
    assert.equal(growthConversationChannelLabel("other"), "Otro canal");
    assert.equal(
      truncateMessagePreview("Hola, quiero información del programa"),
      "Hola, quiero información del programa"
    );
    assert.equal(
      truncateMessagePreview("x".repeat(100)).endsWith("…"),
      true
    );

    const now = new Date("2026-09-07T15:00:00.000Z");
    const today = formatMensajeWhen("2026-09-07T12:30:00.000Z", now);
    assert.match(today, /^Hoy,/);
    assert.equal(isOutboundSendFailed("failed"), true);
    assert.equal(isOutboundSendFailed("sent"), false);
  });

  it("no inventa no leído en la lista", () => {
    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.doesNotMatch(read, /unread:\s*true/);
    assert.doesNotMatch(read, /unreadCount/);
  });
});

describe("OT-GROWTH-MESSAGING-004 — frontera", () => {
  it("no reescribe el motor MESSAGING-001/002/003", () => {
    const reply = readSrc(
      "src/app/api/growth/conversaciones/[id]/reply/route.ts"
    );
    assert.match(reply, /OT-GROWTH-MESSAGING-003/);
    assert.match(reply, /sendWhatsAppReply/);

    const inbound = readSrc(
      "src/core/growth/messaging/record-inbound-message.ts"
    );
    assert.doesNotMatch(inbound, /MensajesInbox|admin\/mensajes/);

    const send = readSrc("src/core/growth/whatsapp/send-reply.ts");
    assert.doesNotMatch(send, /MensajesInbox|admin\/mensajes/);
  });
});
