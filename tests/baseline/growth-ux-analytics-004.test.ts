/**
 * OT-GROWTH-UX-ANALYTICS-004 — superficie visual Analítica V1.
 * No toca read model / API; valida jerarquía, copy y no-toques.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("OT-GROWTH-UX-ANALYTICS-004 — diseño final Analítica", () => {
  it("usa AnaliticaClient y conserva lectura tenant del adaptador", () => {
    const page = readSrc("src/app/admin/analitica/page.tsx");
    assert.match(page, /AnaliticaClient/);
    assert.match(page, /getAnalyticsV1/);
    assert.match(page, /growth\.analytics\.view/);
  });

  it("copy humano de cabecera, períodos y error", () => {
    const labels = readSrc("src/lib/growth/labels.ts");
    assert.match(labels, /Entiende cómo está funcionando tu negocio/);
    assert.match(labels, /Intentar nuevamente/);
    assert.match(labels, /Personalizado/);
    assert.match(labels, /No hay campañas con actividad en este período/);
    assert.match(labels, /Aún no hay oportunidades en este período/);
    assert.doesNotMatch(labels, /Rango personalizado/);
    assert.doesNotMatch(labels, /Historial comercial del Espacio activo/);
  });

  it("jerarquía de historia + selector de período sin UTC técnico", () => {
    const client = readSrc("src/components/admin/growth/AnaliticaClient.tsx");
    assert.match(client, /¿Qué está pasando\?/);
    assert.match(client, /¿De dónde llegan\?/);
    assert.match(client, /¿Qué pasa con las oportunidades\?/);
    assert.match(client, /¿Qué está funcionando\?/);
    assert.match(client, /¿Por dónde nos hablan\?/);
    assert.match(client, /En seguimiento ahora/);
    assert.match(client, /De las oportunidades generadas/);
    assert.match(client, /¿Dónde estamos perdiendo\?/);
    assert.match(client, /Conversaciones sin respuesta/);
    assert.match(client, /AdminModulePage/);
    assert.match(client, /data-analitica-page/);
    assert.doesNotMatch(client, /fin exclusivo|\(UTC/);
    assert.doesNotMatch(client, /\bcohorte\b|\bclosedAt\b|\bopenedAt\b/);
    assert.doesNotMatch(client, /trackingKey|ROAS|CTR|SLA|response time/);
    assert.doesNotMatch(client, /Personas → Oportunidades → Ganadas/);
  });

  it("no toca backend ni motores prohibidos", () => {
    const client = readSrc(
      "src/components/admin/growth/AnaliticaClient.tsx"
    );
    assert.match(client, /\/api\/growth\/analytics/);
    assert.doesNotMatch(client, /getAnalyticsV1|buildAnalyticsV1Response/);
    assert.doesNotMatch(client, /deriveCampaignMetrics/);

    const aggregate = readSrc("src/lib/growth/analytics-aggregate.ts");
    assert.match(aggregate, /OT-GROWTH-ANALYTICS-IMPLEMENT-003/);
    const period = readSrc("src/lib/growth/analytics-period.ts");
    assert.match(period, /OT-GROWTH-ANALYTICS-IMPLEMENT-003/);
    const read = readSrc("src/lib/growth/analytics-read.ts");
    assert.match(read, /OT-GROWTH-ANALYTICS-IMPLEMENT-003/);
  });
});
