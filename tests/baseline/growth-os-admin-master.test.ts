/**
 * OT-GROWTH-UX-ADMIN-MASTER-001 / 001A — proyección Inicio + navegación maestra.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GROWTH_NO_NEXT_ACTION_LABEL } from "../../src/lib/growth/labels";
import type { GrowthPersonaListItemView } from "../../src/lib/growth/persona-view";
import {
  masterNavLabels,
  emptyGrowthOsHomeView,
  humanizeHomeActivityStory,
  humanizeHomeSituation,
  humanizeOriginDisplayLabel,
  projectGrowthOsHome,
} from "../../src/components/admin/preview/growth-os-master";

const FORBIDDEN_UI =
  /\b(CRM|pipeline|lead|trigger|activity log|tenant|ingest)\b/i;
const FORBIDDEN_COPY = /\+100%|vs\.\s*mes anterior|agentes IA|ingresos/i;
const TECHNICAL_ORIGIN_ID = /portal-admision/;

function persona(
  partial: Partial<GrowthPersonaListItemView> & Pick<GrowthPersonaListItemView, "id">
): GrowthPersonaListItemView {
  return {
    displayName: "Ana Pérez",
    originLabel: "Admisión · portal-admision",
    opportunityCount: 1,
    opportunitySummary: "Conversión · En seguimiento",
    nextActionLabel: "Llamar para confirmar interés",
    updatedAt: "2026-09-05T12:00:00.000Z",
    ...partial,
  };
}

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("OT-GROWTH-UX-ADMIN-MASTER-001 — maqueta Inicio", () => {
  it("estado vacío conserva ceros y bloques sin datos inventados", () => {
    const view = emptyGrowthOsHomeView();
    assert.equal(view.metrics.personas, 0);
    assert.equal(view.metrics.oportunidades, 0);
    assert.equal(view.metrics.porAtender, 0);
    assert.equal(view.metrics.actividad, 0);
    assert.equal(view.attention.length, 0);
    assert.equal(view.opportunities.length, 0);
    assert.equal(view.activity.length, 0);
    assert.equal(view.origins.length, 0);
  });

  it("proyecta métricas reales y atención desde Personas existentes", () => {
    const view = projectGrowthOsHome({
      personas: [
        persona({ id: "p1" }),
        persona({
          id: "p2",
          displayName: "Luis Soto",
          originLabel: "Formulario · contacto",
          opportunityCount: 0,
          opportunitySummary: undefined,
          nextActionLabel: GROWTH_NO_NEXT_ACTION_LABEL,
        }),
      ],
      activityCount: 3,
      activities: [
        {
          id: "a1",
          story: "Ana Pérez envió una postulación.",
          tone: "form",
          occurredAt: "2026-09-05T11:00:00.000Z",
          personaName: "Ana Pérez",
        },
      ],
    });

    assert.equal(view.metrics.personas, 2);
    assert.equal(view.metrics.oportunidades, 1);
    assert.equal(view.metrics.porAtender, 1);
    assert.equal(view.metrics.actividad, 3);
    assert.equal(view.attention.length, 1);
    assert.equal(view.attention[0]?.displayName, "Ana Pérez");
    assert.equal(view.attention[0]?.nextActionLabel, "Llamar para confirmar interés");
    assert.equal(view.attention[0]?.originLabel, "Portal web / Admisión");
    assert.equal(view.attention[0]?.typeLabel, "Conversión");
    assert.equal(view.attention[0]?.situationLabel, "Conversión en seguimiento");
    assert.equal(view.opportunities.length, 1);
    assert.deepEqual(view.origins, [
      { label: "Formulario / Contacto", count: 1 },
      { label: "Portal web / Admisión", count: 1 },
    ]);
  });

  it("001A — no muestra identificadores técnicos de origen", () => {
    assert.equal(
      humanizeOriginDisplayLabel("Admisión · portal-admision"),
      "Portal web / Admisión"
    );
    assert.equal(
      humanizeOriginDisplayLabel("portal-admision"),
      "Portal web / Admisión"
    );
    assert.equal(
      humanizeOriginDisplayLabel("Formulario · information_request"),
      "Formulario / Solicitud de información"
    );
    assert.equal(
      humanizeOriginDisplayLabel("Portal web / Admisión"),
      "Portal web / Admisión"
    );

    const view = projectGrowthOsHome({
      personas: [
        persona({ id: "p1" }),
        persona({
          id: "p2",
          originLabel: "Formulario · information_request",
          opportunityCount: 0,
          opportunitySummary: undefined,
          nextActionLabel: GROWTH_NO_NEXT_ACTION_LABEL,
        }),
        persona({
          id: "p3",
          originLabel: "Evento · event_registration",
          opportunityCount: 0,
          opportunitySummary: undefined,
          nextActionLabel: GROWTH_NO_NEXT_ACTION_LABEL,
        }),
      ],
      activityCount: 0,
      activities: [],
    });
    for (const origin of view.origins) {
      assert.equal(TECHNICAL_ORIGIN_ID.test(origin.label), false, origin.label);
    }
    assert.equal(view.origins.length, 3);
  });

  it("representa la navegación maestra sin inventar módulos funcionales", () => {
    const labels = masterNavLabels();
    assert.deepEqual(labels, [
      "Inicio",
      "Personas",
      "Ventas",
      "Mensajes",
      "Actividad",
      "Crecer",
      "Campañas",
      "Automatizaciones",
      "Analítica",
      "Sitio web",
      "Equipo",
      "Ajustes",
    ]);
  });

  it("la maqueta no introduce jerga ni tendencias inventadas", () => {
    const files = [
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx",
      "src/components/admin/preview/growth-os-master/GrowthOsAdminMasterShell.tsx",
      "src/components/admin/preview/growth-os-master/project-home.ts",
      "src/components/admin/preview/growth-os-master/humanize-origin-display.ts",
      "src/components/admin/preview/growth-os-master/humanize-home-activity.ts",
    ];
    for (const file of files) {
      const src = readSrc(file);
      assert.equal(FORBIDDEN_UI.test(src), false, `${file} jerga`);
      assert.equal(FORBIDDEN_COPY.test(src), false, `${file} tendencias`);
    }
  });

  it("001A — próxima acción accionable y CTA Atender con destino real", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    assert.match(home, /Atender/);
    assert.match(home, /\/admin\/personas\/\$\{encodeURIComponent\(item\.id\)\}/);
    assert.doesNotMatch(home, /GROWTH_VIEW_DETAIL_LABEL/);
    assert.doesNotMatch(home, /ChartPlaceholder|sparkline|porcentaje/i);
  });

  it("003 — humaniza hechos técnicos en «Qué ha pasado»", () => {
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_opened",
        summary: "Oportunidad abierta (inquiry)",
        personaName: "María González",
      }).story,
      "Se creó una oportunidad para María González."
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_transitioned",
        summary: "Oportunidad open → active",
      }).story,
      "La oportunidad pasó a En seguimiento."
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "next_action_set",
        summary: "Próxima acción: Llamar para confirmar interés",
      }).story,
      "Growth OS programó un seguimiento."
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "handoff",
        summary: "Handoff registrado",
      }).story,
      "Una oportunidad fue traspasada."
    );
    assert.deepEqual(humanizeHomeSituation("Consulta · En seguimiento"), {
      typeLabel: "Consulta",
      situationLabel: "Consulta en seguimiento",
    });
  });

  it("003 — Inicio prioriza atención; sin bloque Oportunidades duplicado ni acciones falsas", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    assert.match(home, /GROWTH_TIMELINE_SECTION_LABEL/);
    assert.match(home, /Ver toda la actividad/);
    assert.match(home, /\/admin\/settings\/activity/);
    assert.match(home, /Tienes \$\{pendingCount\} cosas que necesitan tu atención/);
    assert.match(home, /Todo está al día/);
    assert.doesNotMatch(home, /Acciones rápidas/);
    assert.doesNotMatch(home, /Agregar persona|Crear oportunidad|Ver mensajes/i);
    assert.doesNotMatch(home, /Qué está abierto en este Espacio/);
    assert.doesNotMatch(home, /\binquiry\b|\bopen\s*→\s*active\b/i);
    assert.doesNotMatch(home, /Handoff registrado|Oportunidad abierta \(/i);
  });

  it("001A — buscador sigue limitado a Personas", () => {
    const shell = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminMasterShell.tsx"
    );
    assert.match(shell, /Buscar personas/);
    assert.match(shell, /\/admin\/personas\?q=/);
    assert.doesNotMatch(shell, /GlobalSearch/);
    assert.doesNotMatch(shell, /búsqueda global/i);
  });

  it("maqueta sigue aislada en /dev-preview; /admin productivo migró en SHELL-002", () => {
    const adminHome = readSrc("src/app/admin/page.tsx");
    assert.match(adminHome, /GrowthOsAdminHomeMaster/);
    assert.match(adminHome, /OT-GROWTH-UX-HOME-003/);
    const preview = readSrc("src/app/dev-preview/admin-master/page.tsx");
    assert.match(preview, /NODE_ENV !== "development"/);
    assert.match(preview, /Maqueta maestra/);
  });
});
