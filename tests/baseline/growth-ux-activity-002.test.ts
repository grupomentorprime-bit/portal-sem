/**
 * OT-GROWTH-UX-ACTIVITY-002 — superficie visual del historial comercial.
 * No toca adaptador/API; valida copy, filtros y acciones humanas.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("OT-GROWTH-UX-ACTIVITY-002 — diseño final Actividad", () => {
  it("usa ActividadFeedClient y conserva lectura tenant del adaptador", () => {
    const page = readSrc("src/app/admin/actividad/page.tsx");
    assert.match(page, /ActividadFeedClient/);
    assert.match(page, /listGrowthActividadFeed/);
    assert.match(page, /growth\.sales\.read/);
    assert.match(page, /growth\.sales\.operate/);
    assert.doesNotMatch(page, /identity\.audit\.read/);
    assert.doesNotMatch(page, /identity_audit|core_events/);
  });

  it("copy humano de cabecera y vacío general", () => {
    const labels = readSrc("src/lib/growth/labels.ts");
    assert.match(
      labels,
      /Todo lo que ha pasado en tu negocio, en un solo lugar/
    );
    assert.match(labels, /Aún no hay actividad/);
    assert.match(
      labels,
      /Cuando lleguen personas, mensajes o avances en ventas/
    );
    assert.doesNotMatch(labels, /Historial comercial del Espacio activo/);
  });

  it("filtros exactos del contrato + timeline sin jerga técnica", () => {
    const client = readSrc(
      "src/components/admin/growth/ActividadFeedClient.tsx"
    );
    assert.match(client, /GROWTH_ACTIVIDAD_FILTER_ALL_LABEL/);
    assert.match(client, /GROWTH_ACTIVIDAD_FILTER_PERSONAS_LABEL/);
    assert.match(client, /GROWTH_ACTIVIDAD_FILTER_VENTAS_LABEL/);
    assert.match(client, /GROWTH_ACTIVIDAD_FILTER_MENSAJES_LABEL/);
    assert.match(client, /GROWTH_ACTIVIDAD_FILTER_AUTOMATIZACIONES_LABEL/);
    assert.match(client, /Cargar más|GROWTH_ACTIVIDAD_LOAD_MORE_LABEL/);
    assert.match(client, /Ver persona|GROWTH_ACTIVIDAD_VIEW_PERSONA_LABEL/);
    assert.match(
      client,
      /Ver oportunidad|GROWTH_ACTIVIDAD_VIEW_OPPORTUNITY_LABEL/
    );
    assert.doesNotMatch(client, /tenantId|growth-automation|open → active/);
    assert.doesNotMatch(client, /identity_audit|core_events|eventId/);
    assert.doesNotMatch(client, /JSON\.stringify/);
  });

  it("no toca backend ni superficies prohibidas", () => {
    const client = readSrc(
      "src/components/admin/growth/ActividadFeedClient.tsx"
    );
    assert.doesNotMatch(client, /listGrowthActividadFeed/);
    assert.match(client, /\/api\/growth\/actividad/);
    const api = readSrc("src/app/api/growth/actividad/route.ts");
    assert.match(api, /listGrowthActividadFeed/);
  });
});
