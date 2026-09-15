/**
 * OT-GROWTH-E2E-FIX-003 — Mensajes ↔ Venta operable.
 * Reutiliza conversation.oportunidadId + proyección Ventas; sin segundo CRM.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GROWTH_MENSAJES_OPPORTUNITY_FIELD_LABEL,
  GROWTH_MENSAJES_STATUS_FIELD_LABEL,
  GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL,
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_NO_NEXT_ACTION_LABEL,
  growthOpportunityStatusLabel,
  growthOpportunityTypeLabel,
} from "../../src/lib/growth/labels";
import { toMensajesThreadOpportunityView } from "../../src/lib/growth/mensajes-view";
import type { GrowthNextAction, GrowthOportunidad } from "../../src/core/growth/types";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function existsSrc(rel: string): boolean {
  return existsSync(resolve(process.cwd(), rel));
}

function sampleNextAction(
  partial: Partial<GrowthNextAction> = {}
): GrowthNextAction {
  return {
    summary: "Contactar a la persona",
    kind: "contact",
    setAt: "2026-09-14T12:00:00.000Z",
    ...partial,
  };
}

function sampleOpp(
  partial: Partial<
    Pick<GrowthOportunidad, "typeKey" | "status" | "nextAction" | "subjectLabel">
  > = {}
): Pick<GrowthOportunidad, "typeKey" | "status" | "nextAction" | "subjectLabel"> {
  return {
    typeKey: "inquiry",
    status: "open",
    nextAction: sampleNextAction(),
    ...partial,
  };
}

describe("OT-GROWTH-E2E-FIX-003 — superficie", () => {
  it("extiende lectura/proyección/UI de Mensajes sin segundo CRM ni sales-ops", () => {
    assert.equal(existsSrc("src/lib/growth/mensajes-view.ts"), true);
    assert.equal(existsSrc("src/lib/growth/mensajes-read.ts"), true);
    assert.equal(
      existsSrc("src/components/admin/growth/MensajesInboxClient.tsx"),
      true
    );

    const view = readSrc("src/lib/growth/mensajes-view.ts");
    assert.match(view, /toMensajesThreadOpportunityView/);
    assert.match(view, /growthOpportunityStatusLabel/);
    assert.match(view, /growthOpportunityTypeLabel/);
    assert.match(view, /GROWTH_NO_NEXT_ACTION_LABEL/);

    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.match(read, /toMensajesThreadOpportunityView/);
    assert.match(read, /findOne\(\{\s*tenantId,\s*_id: conversation\.oportunidadId\s*\}\)/);
    assert.doesNotMatch(read, /openGrowthOpportunity|sales-ops|setGrowthNextAction/);

    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /data-mensajes-opportunity-context/);
    assert.match(ui, /GROWTH_MENSAJES_OPPORTUNITY_FIELD_LABEL/);
    assert.match(ui, /GROWTH_MENSAJES_STATUS_FIELD_LABEL/);
    assert.match(ui, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(ui, /GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL/);
    assert.match(
      ui,
      /\/admin\/ventas\/\$\{encodeURIComponent\(thread\.oportunidadId\)\}/
    );
    assert.doesNotMatch(
      ui,
      /setNextAction|clearNextAction|transitionGrowth|sales-ops|Registrar contacto|Quitar acción/
    );

    assert.equal(GROWTH_MENSAJES_VIEW_OPPORTUNITY_LABEL, "Ver oportunidad");
    assert.equal(GROWTH_MENSAJES_OPPORTUNITY_FIELD_LABEL, "Oportunidad");
    assert.equal(GROWTH_MENSAJES_STATUS_FIELD_LABEL, "Estado");
    assert.equal(GROWTH_NEXT_ACTION_SECTION_LABEL, "Qué hacer ahora");
  });

  it("no toca Meta, receive WhatsApp ni Automatizaciones", () => {
    const receive = readSrc("src/core/growth/whatsapp/receive.ts");
    const webhook = readSrc("src/app/api/webhooks/whatsapp/route.ts");
    const runtime = readSrc("src/core/growth/automations/runtime.ts");
    // Esta OT no modifica esos motores: el acta valida alcance por ausencia de
    // cambios funcionales nuevos; aquí solo se ancla que siguen existiendo.
    assert.match(receive, /receiveWhatsAppCloudWebhook/);
    assert.match(webhook, /receiveWhatsAppCloudWebhook/);
    assert.match(runtime, /handleGrowthAutomationEvent|executeAction/);
  });
});

describe("OT-GROWTH-E2E-FIX-003 — proyección A/C/D/F", () => {
  it("A — conversación con opp proyecta Oportunidad, Estado y Qué hacer ahora", () => {
    const view = toMensajesThreadOpportunityView(sampleOpp());
    assert.equal(view.typeLabel, growthOpportunityTypeLabel("inquiry"));
    assert.equal(view.typeLabel, "Consulta");
    assert.equal(view.statusLabel, growthOpportunityStatusLabel("open"));
    assert.equal(view.statusLabel, "Abierta");
    assert.equal(view.nextActionLabel, "Contactar a la persona");
    assert.equal(view.status, "open");
  });

  it("C/D — nextAction y estado coinciden con etiquetas de Ventas", () => {
    const opp = sampleOpp({
      typeKey: "conversion",
      status: "active",
      nextAction: sampleNextAction({
        summary: "Llamar para confirmar interés",
      }),
      subjectLabel: "MBA",
    });
    const mensajes = toMensajesThreadOpportunityView(opp);
    assert.equal(
      mensajes.typeLabel,
      `${growthOpportunityTypeLabel(opp.typeKey)} · MBA`
    );
    assert.equal(
      mensajes.statusLabel,
      growthOpportunityStatusLabel(opp.status)
    );
    assert.equal(mensajes.statusLabel, "En seguimiento");
    assert.equal(mensajes.nextActionLabel, opp.nextAction!.summary);
  });

  it("F — opp final muestra estado real y nextAction ausente humano", () => {
    const won = toMensajesThreadOpportunityView(
      sampleOpp({ status: "won", nextAction: null })
    );
    assert.equal(won.statusLabel, "Ganada");
    assert.equal(won.nextActionLabel, GROWTH_NO_NEXT_ACTION_LABEL);

    const lost = toMensajesThreadOpportunityView(
      sampleOpp({ status: "lost", nextAction: null })
    );
    assert.equal(lost.statusLabel, "Perdida");
    assert.equal(lost.nextActionLabel, GROWTH_NO_NEXT_ACTION_LABEL);
  });

  it("lenguaje humano — sin typeKeys ni estados técnicos en etiquetas", () => {
    const view = toMensajesThreadOpportunityView(
      sampleOpp({ typeKey: "inquiry", status: "open" })
    );
    assert.doesNotMatch(view.typeLabel, /inquiry|typeKey/i);
    assert.doesNotMatch(view.statusLabel, /\bopen\b|\bactive\b|won|lost/i);
    assert.equal(view.statusLabel, "Abierta");
    assert.equal(view.typeLabel, "Consulta");
    // El summary humano puede hablar de contactar; no debe ser el kind técnico solo.
    assert.notEqual(view.nextActionLabel, "contact");
  });
});

describe("OT-GROWTH-E2E-FIX-003 — UI B/E/H", () => {
  it("B — Ver oportunidad apunta a la ficha existente de Ventas", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(
      ui,
      /href=\{`\/admin\/ventas\/\$\{encodeURIComponent\(thread\.oportunidadId\)\}`\}/
    );
    assert.equal(existsSrc("src/app/admin/ventas/[id]/page.tsx"), true);
    const ventasPage = readSrc("src/app/admin/ventas/[id]/page.tsx");
    assert.match(ventasPage, /getGrowthVentasOperateView|VentasOperateClient/);
  });

  it("E — sin oportunidad vinculada no inventa contexto ni CTA", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /thread\.oportunidadId && thread\.opportunity/);
    assert.match(ui, /data-mensajes-opportunity-context/);
    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.match(
      read,
      /conversation\.oportunidadId\s*\?\s*[\s\S]*findOne[\s\S]*:\s*Promise\.resolve\(null\)/
    );
    assert.doesNotMatch(read, /openGrowthOpportunity/);
  });

  it("H — layout mobile conserva stack (contexto + CTA full width)", () => {
    const ui = readSrc("src/components/admin/growth/MensajesInboxClient.tsx");
    assert.match(ui, /flex-col gap-3 sm:flex-row/);
    assert.match(ui, /w-full shrink-0 sm:w-auto/);
    assert.match(ui, /md:grid-cols-/);
    assert.match(ui, /hidden md:flex|md:hidden/);
  });
});

describe("OT-GROWTH-E2E-FIX-003 — tenant G", () => {
  it("G — resolución de Oportunidad siempre con tenantId del Espacio", () => {
    const read = readSrc("src/lib/growth/mensajes-read.ts");
    assert.match(
      read,
      /findOne\(\{\s*tenantId,\s*_id: conversation\.oportunidadId\s*\}\)/
    );
    assert.match(
      read,
      /findOne\(\{\s*tenantId,\s*_id: conversationId\s*\}\)/
    );
    // No hay lookup cross-tenant por id suelto.
    assert.doesNotMatch(read, /findOne\(\{\s*_id: conversation\.oportunidadId\s*\}\)/);
  });
});
