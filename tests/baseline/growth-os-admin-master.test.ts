/**
 * OT-GROWTH-UX-ADMIN-MASTER-001 / 001A / HOME-004 — proyección Inicio + navegación maestra.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GROWTH_NO_NEXT_ACTION_LABEL } from "../../src/lib/growth/labels";
import type { GrowthPersonaListItemView } from "../../src/lib/growth/persona-view";
import {
  masterNavLabels,
  compressHomeActivityFeed,
  emptyGrowthOsHomeView,
  humanizeHomeActivityStory,
  humanizeHomeSituation,
  humanizeOriginDisplayLabel,
  projectGrowthOsHome,
  projectGrowthOsHomeDashboard,
} from "../../src/components/admin/preview/growth-os-master";
import {
  buildHomeFunnelFigure,
  funnelSegmentColor,
  funnelSilhouetteEdge,
  FUNNEL_RESULT_COLOR,
} from "../../src/components/admin/preview/growth-os-master/home-funnel-figure";
import {
  percentChange,
  projectHomeMetricTrends,
} from "../../src/components/admin/preview/growth-os-master/home-metric-trends";
import type { ConversionAnalyticsResponse } from "../../src/lib/growth/conversion-analytics";
import {
  CONVERSION_DENOMINATORS,
  CONVERSION_RATE_NOTE,
} from "../../src/lib/growth/conversion-analytics";

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

const caps = {
  salesView: true,
  salesOperate: true,
  salesRead: true,
  campaignsView: true,
  analyticsView: true,
  peopleView: true,
  activityView: true,
} as const;

function minimalAnalytics(
  partial?: Partial<ConversionAnalyticsResponse>
): ConversionAnalyticsResponse {
  return {
    tenantId: "t1",
    period: {
      preset: "last_30d",
      start: "2026-08-12T00:00:00.000Z",
      end: "2026-09-11T00:00:00.000Z",
      timezone: "UTC",
    },
    readAt: "2026-09-11T15:00:00.000Z",
    denominators: { ...CONVERSION_DENOMINATORS },
    rateNote: CONVERSION_RATE_NOTE,
    captacion: {
      total: 3,
      archivedNow: 0,
      byFunnel: [{ key: "default", label: "Ventas", count: 3 }],
      byOrigin: [
        { key: "form", label: "Formulario", count: 2 },
        { key: "whatsapp", label: "WhatsApp", count: 1 },
      ],
    },
    stock: {
      byFunnel: [
        {
          funnelKey: "default",
          funnelLabel: "Ventas",
          stages: [
            { key: "nuevo", label: "Nuevo interesado", count: 2 },
            { key: "propuesta", label: "Propuesta enviada", count: 1 },
          ],
        },
      ],
    },
    movement: { byFunnel: [], ilegible: 0 },
    closures: { won: 1, lost: 0, handedOff: 0, byFunnel: [] },
    losses: {
      total: 0,
      byExitStage: [],
      reasonsRecorded: false,
      reasonsNote: "Los motivos de pérdida no se registran.",
    },
    dwell: { byFunnel: [] },
    cycle: {
      won: { medianMs: null, count: 0 },
      lost: { medianMs: null, count: 0 },
    },
    cohorts: {
      byFunnel: [
        {
          key: "default",
          label: "Ventas",
          cohort: 3,
          won: 1,
          open: 2,
          lost: 0,
          handedOff: 0,
          rate: 1 / 3,
        },
      ],
      byCampaign: [],
      bySource: [],
    },
    owners: [
      {
        userId: "u1",
        label: "Marco",
        open: 2,
        won: 1,
        lost: 0,
        handedOff: 0,
        wonCycleMedianMs: null,
        wonCycleCount: 0,
      },
    ],
    quality: {
      sinFechaApertura: 0,
      sinFechaCierre: 0,
      historialIncompleto: 0,
      movimientoIlegible: 0,
      campanaNoRegistrada: 0,
      etapaDeSalidaNoRegistrada: 0,
    },
    ...partial,
  };
}

describe("OT-GROWTH-UX-ADMIN-MASTER-001 — maqueta Inicio", () => {
  it("estado vacío conserva ceros y bloques sin datos inventados", () => {
    const view = emptyGrowthOsHomeView();
    assert.equal(view.metrics.personas, 0);
    assert.equal(view.metrics.oportunidades, 0);
    assert.equal(view.metrics.nuevosProspectos, 0);
    assert.equal(view.metrics.porAtender, 0);
    assert.equal(view.metrics.actividad, 0);
    assert.equal(view.attention.length, 0);
    assert.equal(view.opportunities.length, 0);
    assert.equal(view.activity.length, 0);
    assert.equal(view.origins.length, 0);
    assert.equal(view.funnel, null);
    assert.equal(view.owners.length, 0);
    assert.equal(view.unassignedOwner, null);
    assert.equal(view.nextSteps.length, 0);
  });

  it("proyecta métricas reales y atención desde Personas existentes (legacy)", () => {
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
    assert.deepEqual(
      view.origins.map((o) => ({ label: o.label, count: o.count })),
      [
        { label: "Formulario / Contacto", count: 1 },
        { label: "Portal web / Admisión", count: 1 },
      ]
    );
  });

  it("004 — dashboard proyecta Conversion Engine + cola comercial sin tendencias", () => {
    const view = projectGrowthOsHomeDashboard({
      analytics: minimalAnalytics(),
      commercialRows: [
        {
          id: "op1",
          personaLabel: "Juan Pérez",
          funnelName: "Ventas",
          stageLabel: "Propuesta",
          bandLabel: "Sin seguimiento",
          band: "unfollowed",
          nextActionSummary: "Llamar",
          href: "/admin/ventas/op1",
          ageLabel: "7 días",
          ownerLabel: "Marco",
        },
      ],
      commercialCounts: { overdue: 0, unfollowed: 1, stale: 0 },
      activityCountInPeriod: 12,
      activities: [
        {
          id: "a1",
          story: "Se asignó responsable.",
          tone: "opportunity",
          occurredAt: "2026-09-11T14:00:00.000Z",
          href: "/admin/ventas/op1",
        },
      ],
      periodLabel: "Últimos 30 días",
      capabilities: caps,
      hasCampaigns: true,
      hasAutomations: false,
      personasCount: 4,
    });

    assert.equal(view.metrics.nuevosProspectos, 3);
    assert.equal(view.metrics.oportunidadesActivas, 3);
    assert.equal(view.metrics.ganadas, 1);
    assert.equal(view.metrics.porAtender, 1);
    assert.equal(view.metrics.actividad, 12);
    assert.equal(view.funnel?.stockTotal, 3);
    assert.equal(view.funnel?.cohortRate, 1 / 3);
    assert.equal(view.funnel?.cohortWon, 1);
    assert.equal(view.funnel?.periodWon, 1);
    assert.equal(view.funnel?.periodWon, view.metrics.ganadas);
    assert.equal(view.funnel?.cohortDenominator, CONVERSION_DENOMINATORS.cohorte);
    const figure = buildHomeFunnelFigure(view.funnel);
    assert.equal(figure?.rows.filter((row) => row.role === "stage").length, 2);
    assert.equal(figure?.rows[0]?.percent, 2 / 3);
    assert.equal(figure?.rows[1]?.percent, 1 / 3);
    assert.equal(figure?.rows[2]?.role, "result");
    assert.equal(figure?.rows[2]?.label, "Ganadas del período");
    assert.equal(figure?.rows[2]?.count, 1);
    assert.equal(figure?.rows[2]?.percent, null);
    assert.equal(view.attention[0]?.href, "/admin/ventas/op1");
    assert.equal(view.attention[0]?.reasonLabel, "Sin seguimiento");
    assert.equal(view.origins[0]?.label, "Formulario");
    assert.equal(view.owners[0]?.label, "Marco");
    assert.equal(view.unassignedOwner, null);
    assert.ok(view.nextSteps.some((s) => s.id === "unfollowed" && s.href === "/admin/ventas?banda=unfollowed"));
    assert.equal(view.nextSteps.some((s) => s.href === "/admin/campanas"), false);
    assert.equal(view.period?.label, "Últimos 30 días");
  });

  it("004 — multi-embudo no mezcla etapas ni ganadas ajenas; operate no abre analítica", () => {
    const multi = minimalAnalytics({
      stock: {
        byFunnel: [
          {
            funnelKey: "retail",
            funnelLabel: "Retail",
            stages: [
              { key: "lead", label: "Lead", count: 2 },
              { key: "cita", label: "Cita", count: 0 },
            ],
          },
          {
            funnelKey: "b2b",
            funnelLabel: "B2B",
            stages: [
              { key: "diagnostico", label: "Diagnóstico", count: 1 },
              { key: "propuesta", label: "Propuesta", count: 0 },
            ],
          },
        ],
      },
      closures: {
        won: 2,
        lost: 0,
        handedOff: 0,
        byFunnel: [
          { funnelKey: "retail", funnelLabel: "Retail", won: 1, lost: 0, handedOff: 0 },
          { funnelKey: "b2b", funnelLabel: "B2B", won: 1, lost: 0, handedOff: 0 },
        ],
      },
      cohorts: {
        byFunnel: [
          {
            key: "retail",
            label: "Retail",
            cohort: 2,
            won: 0,
            open: 2,
            lost: 0,
            handedOff: 0,
            rate: 0,
          },
          {
            key: "b2b",
            label: "B2B",
            cohort: 1,
            won: 0,
            open: 1,
            lost: 0,
            handedOff: 0,
            rate: 0,
          },
        ],
        byCampaign: [],
        bySource: [],
      },
    });

    const mixedOrder = projectGrowthOsHomeDashboard({
      analytics: multi,
      commercialRows: [],
      commercialCounts: { overdue: 0, unfollowed: 0, stale: 0 },
      activityCountInPeriod: 0,
      activities: [],
      periodLabel: "Últimos 30 días",
      capabilities: caps,
      hasCampaigns: false,
      hasAutomations: false,
      funnelStageOrder: {
        funnelKey: "b2b",
        stages: [
          { key: "diagnostico", label: "Diagnóstico" },
          { key: "propuesta", label: "Propuesta" },
        ],
      },
    });
    assert.equal(mixedOrder.funnel?.funnelKey, "retail");
    // Orden ajeno (b2b) se ignora: solo stock del embudo primario con count > 0.
    assert.deepEqual(
      mixedOrder.funnel?.stages.map((s) => s.key),
      ["lead"]
    );
    assert.equal(
      mixedOrder.funnel?.stages.some((s) => s.key === "diagnostico"),
      false
    );
    assert.equal(mixedOrder.funnel?.periodWon, 1);
    assert.equal(mixedOrder.metrics.ganadas, 2);
    assert.notEqual(mixedOrder.funnel?.periodWon, mixedOrder.metrics.ganadas);

    const aligned = projectGrowthOsHomeDashboard({
      analytics: multi,
      commercialRows: [],
      commercialCounts: { overdue: 0, unfollowed: 0, stale: 0 },
      activityCountInPeriod: 0,
      activities: [],
      periodLabel: "Últimos 30 días",
      capabilities: caps,
      hasCampaigns: false,
      hasAutomations: false,
      funnelStageOrder: {
        funnelKey: "retail",
        stages: [
          { key: "lead", label: "Lead" },
          { key: "cita", label: "Cita" },
        ],
      },
    });
    assert.deepEqual(
      aligned.funnel?.stages.map((s) => ({ key: s.key, count: s.count })),
      [
        { key: "lead", count: 2 },
        { key: "cita", count: 0 },
      ]
    );

    const operateOnly = projectGrowthOsHomeDashboard({
      analytics: multi,
      commercialRows: [],
      commercialCounts: { overdue: 0, unfollowed: 0, stale: 0 },
      activityCountInPeriod: 0,
      activities: [],
      periodLabel: "Últimos 30 días",
      capabilities: {
        ...caps,
        salesView: false,
        salesOperate: true,
        salesRead: false,
        campaignsView: false,
      },
      hasCampaigns: true,
      hasAutomations: false,
    });
    assert.equal(operateOnly.owners.length, 0);
    assert.equal(operateOnly.unassignedOwner, null);
    assert.equal(
      operateOnly.nextSteps.some((s) => s.href === "/admin/conversion/analitica"),
      false
    );
    assert.equal(
      operateOnly.nextSteps.some((s) => s.id === "campaigns" || s.href === "/admin/campanas"),
      false
    );
  });

  it("004 — el embudo no convierte el stock en una secuencia ni inventa Ganadas", () => {
    const stockOnly = buildHomeFunnelFigure({
      funnelKey: "default",
      funnelLabel: "Ventas",
      stages: [
        { key: "nuevo", label: "Nuevo interesado", count: 16, shareOfStock: 16 / 31 },
        { key: "contacto", label: "Primer contacto", count: 6, shareOfStock: 6 / 31 },
      ],
      stockTotal: 31,
      cohortRate: null,
      cohortSize: 0,
      cohortWon: 0,
      periodWon: 0,
      stockDenominator: CONVERSION_DENOMINATORS.stock,
      cohortDenominator: CONVERSION_DENOMINATORS.cohorte,
      cohortNote: CONVERSION_RATE_NOTE,
    });
    assert.equal(stockOnly?.rows.some((row) => row.role === "result"), false);
    assert.equal(stockOnly?.rows[0]?.percent, 16 / 31);
    assert.notEqual(stockOnly?.rows[1]?.percent, 6 / 16);

    const withPeriodWon = buildHomeFunnelFigure({
      funnelKey: "default",
      funnelLabel: "Ventas",
      stages: [
        { key: "nuevo", label: "Nuevo interesado", count: 16, shareOfStock: 16 / 31 },
        { key: "contacto", label: "Primer contacto", count: 6, shareOfStock: 6 / 31 },
      ],
      stockTotal: 31,
      cohortRate: 0.135,
      cohortSize: 37,
      cohortWon: 5,
      periodWon: 5,
      stockDenominator: CONVERSION_DENOMINATORS.stock,
      cohortDenominator: CONVERSION_DENOMINATORS.cohorte,
      cohortNote: CONVERSION_RATE_NOTE,
    });
    const result = withPeriodWon?.rows.find((row) => row.role === "result");
    assert.equal(result?.label, "Ganadas del período");
    assert.equal(result?.count, 5);
    assert.equal(result?.percent, null);
    assert.equal(
      withPeriodWon?.rows
        .filter((row) => row.role === "stage")
        .reduce((sum, row) => sum + (row.percent ?? 0), 0)
        .toFixed(6),
      (22 / 31).toFixed(6)
    );

    assert.equal(
      buildHomeFunnelFigure({
        funnelKey: "default",
        funnelLabel: "Ventas",
        stages: [{ key: "nuevo", label: "Nuevo interesado", count: 0, shareOfStock: null }],
        stockTotal: 0,
        cohortRate: 0.1,
        cohortSize: 4,
        cohortWon: 1,
        periodWon: 1,
        stockDenominator: "",
        cohortDenominator: "",
        cohortNote: "",
      }),
      null
    );

    const edges = [0, 1, 2, 3, 4, 5, 6].map((index) =>
      funnelSilhouetteEdge(index, 6, 20)
    );
    assert.equal(edges[0], 100);
    assert.equal(edges[6], 20);
    for (let i = 1; i < edges.length; i += 1) {
      assert.ok(edges[i]! < edges[i - 1]!, `corte ${i} no se estrecha`);
    }
    assert.equal(funnelSegmentColor(0, 5, "stage"), "#5B2DE0");
    assert.equal(funnelSegmentColor(4, 5, "stage"), "#5FD09C");
    assert.equal(funnelSegmentColor(2, 3, "stage"), "#4E9FFF");
    assert.equal(funnelSegmentColor(0, 5, "result"), FUNNEL_RESULT_COLOR);
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
      "src/components/admin/preview/growth-os-master/HomeConversionFunnel.tsx",
      "src/components/admin/preview/growth-os-master/home-funnel-figure.ts",
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

  it("004 — CTA Revisar con destino real; la curva usa trends, no porcentajes de maqueta", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    assert.match(home, /Revisar/);
    assert.match(home, /item\.href/);
    assert.match(home, /home\.trends/);
    assert.doesNotMatch(home, /\+18%|\+12%|\+33%|472|1\.263|vs\.\s*mes|Meta Ads|Google Ads/i);
    assert.match(home, /etapas = abiertas ahora; Ganadas del período es resultado/);
    assert.match(home, /Conversión total:/);
    assert.match(home, /cohortDenominator/);
    assert.match(home, /HomeConversionFunnel/);
    assert.doesNotMatch(home, /won-period|stage\.count \/ top|FUNNEL_HEX/);
    const funnelUi = readSrc(
      "src/components/admin/preview/growth-os-master/HomeConversionFunnel.tsx"
    );
    assert.match(funnelUi, /resultado del período, no es una etapa del stock/);
    assert.match(funnelUi, /Participación del stock activo/);
    assert.match(funnelUi, /del stock/);
    assert.doesNotMatch(funnelUi, /metrics\.ganadas|cohortRate/);
    const funnelFigure = readSrc(
      "src/components/admin/preview/growth-os-master/home-funnel-figure.ts"
    );
    assert.match(funnelFigure, /Ganadas del período/);
    assert.match(funnelFigure, /periodWon/);
    assert.doesNotMatch(funnelFigure, /cohortRate/);
    assert.match(home, /HomePeriodSelect/);
  });

  it("003 — humaniza hechos técnicos en actividad reciente", () => {
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
        kind: "opportunity_transitioned",
        summary: "Oportunidad open → active",
      }).tone,
      "stage"
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_transitioned",
        summary: "Oportunidad active → won",
      }).tone,
      "close"
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "opportunity_assigned",
        summary: "Responsable asignado",
        personaName: "Ana",
      }).tone,
      "assignment"
    );
    assert.equal(
      humanizeHomeActivityStory({
        kind: "contact",
        summary: "Llamada realizada",
      }).tone,
      "contact"
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

  it("004 — comprime formulario + apertura y separa Sin responsable", () => {
    const compressed = compressHomeActivityFeed(
      [
        {
          id: "a2",
          kind: "opportunity_opened",
          story: "Se creó una oportunidad para Laura.",
          tone: "opportunity",
          occurredAt: "2026-10-19T12:05:00.000Z",
          personaName: "Laura",
          personaId: "p1",
          oportunidadId: "op1",
          href: "/admin/ventas/op1",
        },
        {
          id: "a1",
          kind: "form_submitted",
          story: "Laura envió un formulario.",
          tone: "form",
          occurredAt: "2026-10-19T12:00:00.000Z",
          personaName: "Laura",
          personaId: "p1",
          href: "/admin/personas/p1",
        },
      ],
      5
    );
    assert.equal(compressed.length, 1);
    assert.match(compressed[0]!.story, /formulario y se abrió/);
    assert.equal(compressed[0]!.tone, "form");

    const view = projectGrowthOsHomeDashboard({
      analytics: minimalAnalytics({
        owners: [
          {
            userId: "u1",
            label: "Marco",
            open: 2,
            won: 1,
            lost: 0,
            handedOff: 0,
            wonCycleMedianMs: null,
            wonCycleCount: 0,
          },
          {
            userId: null,
            label: "Sin responsable",
            open: 4,
            won: 0,
            lost: 0,
            handedOff: 0,
            wonCycleMedianMs: null,
            wonCycleCount: 0,
          },
          {
            userId: null,
            label: "Sin atribución de responsable",
            open: 0,
            won: 2,
            lost: 0,
            handedOff: 0,
            wonCycleMedianMs: null,
            wonCycleCount: 0,
          },
        ],
      }),
      commercialRows: [],
      commercialCounts: { overdue: 3, unfollowed: 2, stale: 1, unassigned: 4 },
      activityCountInPeriod: 0,
      activities: [],
      periodLabel: "Últimos 30 días",
      capabilities: caps,
      hasCampaigns: true,
      hasAutomations: true,
    });
    assert.deepEqual(
      view.owners.map((o) => o.label),
      ["Marco"]
    );
    assert.deepEqual(view.unassignedOwner, { open: 4 });
    assert.deepEqual(
      view.nextSteps.map((s) => ({ id: s.id, count: s.count, href: s.href })),
      [
        { id: "overdue", count: 3, href: "/admin/ventas?banda=overdue" },
        { id: "unfollowed", count: 2, href: "/admin/ventas?banda=unfollowed" },
        { id: "stale", count: 1, href: "/admin/ventas?banda=stale" },
        { id: "unassigned", count: 4, href: "/admin/ventas?banda=unassigned" },
      ]
    );
  });

  it("004 — Inicio prioriza atención comercial; enlaces reales; sin acciones falsas", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    assert.match(home, /Actividad reciente/);
    assert.match(home, /Ver toda la actividad/);
    assert.match(home, /\/admin\/actividad/);
    assert.doesNotMatch(home, /\/admin\/settings\/activity/);
    assert.match(home, /Aquí tienes el estado de/);
    assert.match(home, /Qué necesita atención/);
    assert.match(home, /Ir a Ventas/);
    assert.match(home, /Pendiente de asignación/);
    assert.match(home, /Activas a cargo vs ganadas/);
    assert.match(home, /CHART_PLOT_H|rounded-t-\[5px\]/);
    assert.match(home, /Al día por ahora/);
    assert.match(home, /ChevronRight/);
    assert.doesNotMatch(home, /Acciones rápidas/);
    assert.doesNotMatch(home, /Agregar persona|Crear oportunidad|Nueva oportunidad/i);
    assert.doesNotMatch(home, /\binquiry\b|\bopen\s*→\s*active\b/i);
    assert.doesNotMatch(home, /Handoff registrado|Oportunidad abierta \(/i);
    assert.doesNotMatch(home, /Revisar rendimiento de campañas|Abrir Mi trabajo/);
    assert.doesNotMatch(home, /OwnerMetricPair|h-2 flex-1 overflow-hidden rounded-full/);
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

  it("maqueta sigue aislada en /dev-preview; /admin productivo usa HOME-004", () => {
    const adminHome = readSrc("src/app/admin/page.tsx");
    assert.match(adminHome, /GrowthOsAdminHomeMaster/);
    assert.match(adminHome, /OT-GROWTH-UX-HOME-004/);
    assert.match(adminHome, /loadGrowthOsHomeSnapshot/);
    assert.match(adminHome, /periodQuery/);
    const preview = readSrc("src/app/dev-preview/admin-master/page.tsx");
    assert.match(preview, /NODE_ENV !== "development"/);
    assert.match(preview, /Maqueta maestra/);
  });

  it("compara el período contra la ventana anterior real, sin porcentajes fijos", () => {
    assert.equal(percentChange(11, 10), 10);
    assert.equal(percentChange(0, 0), 0);
    assert.equal(percentChange(4, 0), null);

    const trends = projectHomeMetricTrends({
      periodStart: "2026-09-01T00:00:00.000Z",
      periodEnd: "2026-10-01T00:00:00.000Z",
      openedAt: [
        "2026-08-10T00:00:00.000Z",
        "2026-09-05T00:00:00.000Z",
        "2026-09-20T00:00:00.000Z",
      ],
      closedWonAt: ["2026-09-18T00:00:00.000Z"],
      activityAt: ["2026-08-15T00:00:00.000Z", "2026-09-12T00:00:00.000Z"],
      openRows: [
        { openedAt: "2026-08-01T00:00:00.000Z", closedAt: null },
        { openedAt: "2026-09-05T00:00:00.000Z", closedAt: null },
      ],
      current: {
        nuevosProspectos: 2,
        oportunidadesActivas: 2,
        ganadas: 1,
        porAtender: 0,
        actividad: 1,
      },
    });

    assert.equal(trends.nuevosProspectos.deltaPct, 100);
    assert.equal(trends.ganadas.deltaPct, null);
    assert.equal(trends.actividad.deltaPct, 0);
    assert.equal(trends.porAtender.deltaPct, null);
    assert.equal(trends.porAtender.series.length, 14);
    assert.ok(trends.porAtender.series.every((n) => n === 0));
    assert.equal(
      trends.nuevosProspectos.series.reduce((sum, n) => sum + n, 0),
      2
    );
    assert.ok(trends.oportunidadesActivas.series.every((n) => n >= 1));
  });

  it("004 — loader no materializa métricas ni ads ficticios", () => {
    const loader = readSrc(
      "src/components/admin/preview/growth-os-master/load-home-snapshot.ts"
    );
    assert.match(loader, /getConversionAnalytics/);
    assert.match(loader, /readCommercialPanel/);
    assert.doesNotMatch(loader, /insertOne|updateOne|deleteOne|Meta Ads|Google Ads/i);
    assert.doesNotMatch(loader, /deriveCampaignMetrics/);
  });
});
