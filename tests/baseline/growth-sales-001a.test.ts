/**
 * OT-GROWTH-SALES-001A — operatividad humana de Ventas (presentación).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GROWTH_NEXT_ACTION_SECTION_LABEL,
  GROWTH_TIMELINE_SECTION_LABEL,
  GROWTH_VENTAS_CHANGE_STATUS_LABEL,
  GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL,
  GROWTH_VENTAS_CURRENT_STATUS_LABEL,
  GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
  GROWTH_VENTAS_REGISTER_CONTACT_LABEL,
  GROWTH_VENTAS_SAVE_NOTE_LABEL,
  growthOpportunityStatusLabel,
} from "../../src/lib/growth/labels";
import { humanizeOriginDisplayLabel } from "../../src/lib/growth/humanize-origin-display";
import { listAvailableGrowthOpportunityTransitions } from "../../src/core/growth";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-SALES-001A — copy y proyección humana", () => {
  it("labels operativos usan lenguaje cotidiano", () => {
    assert.equal(GROWTH_NEXT_ACTION_SECTION_LABEL, "Qué hacer ahora");
    assert.equal(GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL, "Quitar acción");
    assert.equal(GROWTH_VENTAS_CURRENT_STATUS_LABEL, "Estado actual");
    assert.equal(GROWTH_VENTAS_CHANGE_STATUS_LABEL, "Cambiar estado");
    assert.equal(GROWTH_VENTAS_SAVE_NOTE_LABEL, "Guardar nota");
    assert.equal(GROWTH_VENTAS_REGISTER_CONTACT_LABEL, "Registrar contacto");
    assert.equal(GROWTH_TIMELINE_SECTION_LABEL, "Qué ha pasado");
    assert.match(
      GROWTH_VENTAS_FOLLOW_UP_PLACEHOLDER,
      /Conversé con María/
    );
  });

  it("origen portal-admision se humaniza en presentación", () => {
    assert.equal(
      humanizeOriginDisplayLabel("Admisión · portal-admision"),
      "Portal web / Admisión"
    );
  });

  it("opciones de estado usan labels humanos del destino", () => {
    const active = listAvailableGrowthOpportunityTransitions("active");
    const labels = active.map((t) => growthOpportunityStatusLabel(t.toState));
    assert.ok(labels.includes("Ganada"));
    assert.ok(labels.includes("Perdida"));
    assert.ok(labels.includes("Traspasada"));
    assert.ok(labels.includes("Archivada"));
    assert.ok(!labels.includes("Cerrar ganada"));
    assert.ok(!labels.includes("win"));
  });

  it("UI Ventas no expone mecánica técnica", () => {
    const operate = readSrc(
      "src/components/admin/growth/VentasOperateClient.tsx"
    );
    const list = readSrc("src/components/admin/growth/VentasListClient.tsx");
    const read = readSrc("src/lib/growth/ventas-read.ts");

    assert.match(operate, /personaDisplayName/);
    assert.match(operate, /GROWTH_VENTAS_CLEAR_NEXT_ACTION_LABEL/);
    assert.match(operate, /GROWTH_VENTAS_SAVE_NOTE_LABEL/);
    assert.match(operate, /GROWTH_VENTAS_REGISTER_CONTACT_LABEL/);
    assert.match(operate, /GROWTH_TIMELINE_SECTION_LABEL/);
    assert.match(operate, /statusPickerOpen/);
    assert.doesNotMatch(operate, /Aplicar estado/);
    assert.doesNotMatch(operate, /Limpiar próxima acción/);
    assert.doesNotMatch(operate, /Hechos de esta Oportunidad/);
    assert.doesNotMatch(operate, /followKind/);
    // Breadcrumb humano: Persona, nunca el id técnico de la Oportunidad.
    assert.match(
      operate,
      /label:\s*item\.personaDisplayName/
    );
    assert.doesNotMatch(
      operate,
      /breadcrumbs=\{[\s\S]*label:\s*item\.id/
    );
    assert.match(list, /GROWTH_NEXT_ACTION_SECTION_LABEL/);
    assert.match(read, /humanizeOriginDisplayLabel/);
    assert.match(read, /growthOpportunityStatusLabel\(t\.toState\)/);
  });

  it("no toca Core ni introduce segundo motor", () => {
    const salesOps = readSrc("src/lib/growth/sales-ops.ts");
    assert.match(salesOps, /transitionGrowthOpportunity/);
    assert.doesNotMatch(salesOps, /crm_/);
    assert.doesNotMatch(readSrc("src/lib/growth/ventas-read.ts"), /crm_/);
  });
});
