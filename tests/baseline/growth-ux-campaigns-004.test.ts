/**
 * OT-GROWTH-UX-CAMPAIGNS-004 — superficie visual Campañas V1.
 * No toca backend/API; valida copy humano, wizard y ausencia de jerga técnica.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("OT-GROWTH-UX-CAMPAIGNS-004 — diseño final Campañas", () => {
  it("listado usa copy OT y resumen real", () => {
    const labels = readSrc("src/lib/growth/campaigns-labels.ts");
    assert.match(
      labels,
      /Organiza cómo atraes personas y acompaña sus resultados/
    );
    assert.match(labels, /Crea tu primera campaña/);
    assert.match(
      labels,
      /Organiza de dónde llegarán las personas y cómo las acompañarás/
    );
    assert.match(labels, /Nueva campaña/);
    assert.match(labels, /Terminar campaña/);

    const list = readSrc(
      "src/components/admin/growth/CampanasListClient.tsx"
    );
    assert.match(list, /CAMPAIGN_NEW_CTA|Nueva campaña/);
    assert.match(list, /Campañas activas/);
    assert.match(list, /Personas captadas/);
    assert.match(list, /Ver campaña|CAMPAIGN_VIEW_CTA/);
    assert.doesNotMatch(list, /trackingKey|formId|ROAS|CTR|impresiones/);
  });

  it("wizard de 4 pasos sin exponer IDs ni trackingKey al operador", () => {
    const labels = readSrc("src/lib/growth/campaigns-labels.ts");
    assert.match(labels, /Qué quieres lograr/);
    assert.match(labels, /De dónde llegarán las personas/);
    assert.match(labels, /Qué seguimiento tendrán/);
    assert.match(labels, /Revisar y activar/);

    const form = readSrc(
      "src/components/admin/growth/CampanaFormClient.tsx"
    );
    assert.match(form, /CAMPAIGN_STEP_1_TITLE/);
    assert.match(form, /CAMPAIGN_STEP_2_TITLE/);
    assert.match(form, /CAMPAIGN_STEP_3_TITLE/);
    assert.match(form, /CAMPAIGN_STEP_4_TITLE/);
    assert.match(form, /CAMPAIGN_SAVE_DRAFT_CTA/);
    assert.match(form, /CAMPAIGN_ACTIVATE_CAMPAIGN_CTA/);
    assert.match(form, /CAMPAIGN_SOURCE_NONE_LABEL/);
    assert.match(form, /Automatización/);
    assert.doesNotMatch(form, /Clave de seguimiento/);
    assert.doesNotMatch(form, /ID del formulario/);
    assert.doesNotMatch(form, /htmlFor="campaign-key"/);
    assert.doesNotMatch(form, />eq</);
    assert.doesNotMatch(form, />AND</);
  });

  it("detalle: acciones por estado, métricas reales, sin trackingKey", () => {
    const detail = readSrc(
      "src/components/admin/growth/CampanaDetailClient.tsx"
    );
    assert.match(detail, /Personas captadas/);
    assert.match(detail, /En seguimiento/);
    assert.match(detail, /Ganadas/);
    assert.match(detail, /Perdidas/);
    assert.match(detail, /Seguimiento automático/);
    assert.match(detail, /Ver actividad del Espacio/);
    assert.match(detail, /Terminar campaña|CAMPAIGN_END_CTA/);
    assert.doesNotMatch(detail, /Clave:/);
    assert.doesNotMatch(detail, /Pausar/);
    assert.doesNotMatch(detail, /ROAS|CTR|alcance|impresiones/);
  });

  it("audiencia se humaniza sin operadores técnicos visibles", () => {
    const labels = readSrc("src/lib/growth/campaigns-labels.ts");
    assert.match(labels, /Estado:/);
    assert.match(labels, /Llegaron por/);
    assert.match(labels, /Llegaron desde/);
    assert.match(labels, /Personas que cumplen todas estas condiciones/);
  });

  it("no toca backend ni APIs de campañas", () => {
    const api = readSrc("src/app/api/growth/campaigns/route.ts");
    assert.match(api, /campaignsCreate/);
    const service = readSrc("src/core/growth/campaigns/service.ts");
    assert.match(service, /createGrowthCampaign/);
    const form = readSrc(
      "src/components/admin/growth/CampanaFormClient.tsx"
    );
    assert.match(form, /\/api\/growth\/campaigns/);
    assert.doesNotMatch(form, /createGrowthCampaign|campaignsCreate/);
  });
});
