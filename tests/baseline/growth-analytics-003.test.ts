/**
 * OT-GROWTH-ANALYTICS-IMPLEMENT-003 — Analítica V1 (read model, períodos, IAM, multi-tenant).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  acquisitionOriginGroupLabel,
  buildAnalyticsV1Response,
  computeConversionRate,
  countUnansweredConversations,
  emptyAnalyticsV1Response,
  formatConversionPercent,
  type AnalyticsCampaignInput,
  type AnalyticsConversationInput,
  type AnalyticsMessageInput,
  type AnalyticsOportunidadInput,
  type AnalyticsPersonaInput,
} from "../../src/lib/growth/analytics-aggregate";
import {
  isTimestampInPeriod,
  resolveAnalyticsPeriod,
} from "../../src/lib/growth/analytics-period";
import { deriveCampaignMetrics } from "../../src/core/growth/campaigns";
import { PERMISSIONS } from "../../src/core/identity/permissions/registry";
import { PERMISSION_MODULES } from "../../src/core/identity/permissions/catalog";
import { PORTAL_TENANT_ROLES } from "../../src/core/identity/roles/defaults";
import { ROLE_PERMISSION_TEMPLATES } from "../../src/core/identity/permissions/role-templates";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import {
  granularToLegacyPermissions,
  legacyPermissionIdsToMap,
} from "../../src/core/identity/permissions/resolver";
import type { GrowthOrigin } from "../../src/core/growth/types";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const NOW = new Date("2026-09-11T15:00:00.000Z");
const PERIOD_30 = resolveAnalyticsPeriod({
  preset: "last_30d",
  now: NOW,
});
assert.ok(PERIOD_30.ok);
const period30 = PERIOD_30.period;

function origin(
  partial: Partial<GrowthOrigin> & Pick<GrowthOrigin, "kind">
): GrowthOrigin {
  return {
    sourceCollection: "test",
    sourceId: "src-1",
    capturedAt: "2026-09-01T00:00:00.000Z",
    ...partial,
  };
}

function persona(
  partial: Partial<AnalyticsPersonaInput> &
    Pick<AnalyticsPersonaInput, "_id" | "tenantId">
): AnalyticsPersonaInput {
  return {
    status: "active",
    createdAt: "2026-09-05T12:00:00.000Z",
    origin: origin({ kind: "form" }),
    ...partial,
  };
}

function opp(
  partial: Partial<AnalyticsOportunidadInput> &
    Pick<
      AnalyticsOportunidadInput,
      "_id" | "tenantId" | "personaId" | "status"
    >
): AnalyticsOportunidadInput {
  return {
    typeKey: "inquiry",
    openedAt: "2026-09-05T12:00:00.000Z",
    origin: origin({ kind: "form" }),
    ...partial,
  };
}

function campaign(
  partial: Partial<AnalyticsCampaignInput> &
    Pick<AnalyticsCampaignInput, "_id" | "tenantId" | "trackingKey">
): AnalyticsCampaignInput {
  return {
    name: partial.name ?? "Campaña",
    ...partial,
  };
}

function conv(
  partial: Partial<AnalyticsConversationInput> &
    Pick<AnalyticsConversationInput, "_id" | "tenantId" | "personaId">
): AnalyticsConversationInput {
  return {
    channel: "whatsapp",
    createdAt: "2026-09-05T12:00:00.000Z",
    ...partial,
  };
}

function msg(
  partial: Partial<AnalyticsMessageInput> &
    Pick<
      AnalyticsMessageInput,
      "_id" | "tenantId" | "conversationId" | "direction"
    >
): AnalyticsMessageInput {
  return {
    occurredAt: "2026-09-05T12:00:00.000Z",
    ...partial,
  };
}

describe("OT-GROWTH-ANALYTICS-IMPLEMENT-003 — superficie", () => {
  it("archivos de read model, API, admin, migración e índices existen", () => {
    for (const rel of [
      "src/lib/growth/analytics-period.ts",
      "src/lib/growth/analytics-aggregate.ts",
      "src/lib/growth/analytics-read.ts",
      "src/app/api/growth/analytics/route.ts",
      "src/app/admin/analitica/page.tsx",
      "src/components/admin/growth/AnaliticaClient.tsx",
      "src/core/migrations/022-growth-analytics.ts",
    ]) {
      assert.ok(existsSync(resolve(process.cwd(), rel)), rel);
    }
  });

  it("AB — endpoint GET no escribe datos (sin mutaciones)", () => {
    const route = readSrc("src/app/api/growth/analytics/route.ts");
    assert.match(route, /export async function GET/);
    assert.doesNotMatch(route, /export async function POST/);
    assert.doesNotMatch(route, /export async function PUT/);
    assert.doesNotMatch(route, /export async function PATCH/);
    assert.doesNotMatch(route, /export async function DELETE/);
    assert.doesNotMatch(route, /insertOne|updateOne|replaceOne|deleteOne/);
    const read = readSrc("src/lib/growth/analytics-read.ts");
    assert.doesNotMatch(read, /insertOne|updateOne|replaceOne|deleteOne/);
  });

  it("S — no modifica deriveCampaignMetrics", () => {
    const metrics = readSrc("src/core/growth/campaigns/metrics.ts");
    assert.match(metrics, /export function deriveCampaignMetrics/);
    const sample = [
      {
        _id: "o1",
        tenantId: "t",
        personaId: "p1",
        status: "won" as const,
        typeKey: "inquiry",
        subjectType: "form" as const,
        origin: origin({ kind: "form", campaign: "c1" }),
        workflowInstanceId: "wf",
        nextAction: null,
        source: { sourceCollection: "x", sourceId: "y" },
        openedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const m = deriveCampaignMetrics(sample);
    assert.equal(m.ganadas, 1);
    assert.equal(m.personasCaptadas, 1);
  });
});

describe("OT-GROWTH-ANALYTICS-IMPLEMENT-003 — períodos A–G", () => {
  it("A — default last_30d", () => {
    const r = resolveAnalyticsPeriod({ now: NOW });
    assert.ok(r.ok);
    assert.equal(r.period.preset, "last_30d");
    assert.equal(r.period.timezone, "UTC");
    assert.equal(r.period.end, NOW.toISOString());
    const start = new Date(r.period.start);
    assert.equal(
      start.toISOString(),
      new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    );
  });

  it("B — last_7d", () => {
    const r = resolveAnalyticsPeriod({ preset: "last_7d", now: NOW });
    assert.ok(r.ok);
    assert.equal(r.period.preset, "last_7d");
    assert.equal(
      r.period.start,
      new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );
  });

  it("C — this_month", () => {
    const r = resolveAnalyticsPeriod({ preset: "this_month", now: NOW });
    assert.ok(r.ok);
    assert.equal(r.period.start, "2026-09-01T00:00:00.000Z");
    assert.equal(r.period.end, NOW.toISOString());
  });

  it("D — previous_month", () => {
    const r = resolveAnalyticsPeriod({ preset: "previous_month", now: NOW });
    assert.ok(r.ok);
    assert.equal(r.period.start, "2026-08-01T00:00:00.000Z");
    assert.equal(r.period.end, "2026-09-01T00:00:00.000Z");
  });

  it("E — custom válido", () => {
    const r = resolveAnalyticsPeriod({
      preset: "custom",
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-09-01T00:00:00.000Z",
    });
    assert.ok(r.ok);
    assert.equal(r.period.preset, "custom");
    assert.equal(r.period.start, "2026-08-01T00:00:00.000Z");
    assert.equal(r.period.end, "2026-09-01T00:00:00.000Z");
  });

  it("F — custom >366 rechazado", () => {
    const r = resolveAnalyticsPeriod({
      preset: "custom",
      from: "2025-01-01T00:00:00.000Z",
      to: "2026-09-01T00:00:00.000Z",
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /366/);
  });

  it("G — [start, end) inclusivo/exclusivo", () => {
    assert.equal(
      isTimestampInPeriod(
        "2026-09-01T00:00:00.000Z",
        "2026-09-01T00:00:00.000Z",
        "2026-10-01T00:00:00.000Z"
      ),
      true
    );
    assert.equal(
      isTimestampInPeriod(
        "2026-10-01T00:00:00.000Z",
        "2026-09-01T00:00:00.000Z",
        "2026-10-01T00:00:00.000Z"
      ),
      false
    );
  });
});

describe("OT-GROWTH-ANALYTICS-IMPLEMENT-003 — métricas H–W", () => {
  it("H — Personas excluye merged/archived", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [
        persona({ _id: "p1", tenantId: "A", status: "active" }),
        persona({ _id: "p2", tenantId: "A", status: "merged" }),
        persona({ _id: "p3", tenantId: "A", status: "archived" }),
      ],
      oportunidades: [],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.summary.personasNuevas, 1);
    assert.equal(data.acquisition.total, 1);
  });

  it("I — Opps excluye archived de cohorte", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "open",
        }),
        opp({
          _id: "o2",
          tenantId: "A",
          personaId: "p1",
          status: "archived",
        }),
      ],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.summary.oportunidadesGeneradas, 1);
    assert.equal(data.sales.conversion.cohort, 1);
  });

  it("J — En seguimiento snapshot sin período", () => {
    const oldOpened = "2025-01-01T00:00:00.000Z";
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "active",
          openedAt: oldOpened,
        }),
      ],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.summary.enSeguimiento, 1);
    assert.equal(data.summary.oportunidadesGeneradas, 0);
  });

  it("K/L — Ganadas/Perdidas usan closedAt", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "won",
          openedAt: "2025-01-01T00:00:00.000Z",
          closedAt: "2026-09-05T00:00:00.000Z",
        }),
        opp({
          _id: "o2",
          tenantId: "A",
          personaId: "p1",
          status: "lost",
          openedAt: "2025-01-01T00:00:00.000Z",
          closedAt: "2026-09-06T00:00:00.000Z",
        }),
        opp({
          _id: "o3",
          tenantId: "A",
          personaId: "p1",
          status: "won",
          openedAt: "2026-09-05T00:00:00.000Z",
          closedAt: "2025-01-01T00:00:00.000Z",
        }),
      ],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.summary.ganadas, 1);
    assert.equal(data.summary.perdidas, 1);
    assert.equal(data.sales.closures.ganadas, 1);
    assert.equal(data.sales.closures.perdidas, 1);
  });

  it("M/N/O — cohorte openedAt; handed_off no es won; denom 0 → null", () => {
    const empty = emptyAnalyticsV1Response(period30);
    assert.equal(empty.sales.conversion.rate, null);
    assert.equal(formatConversionPercent(null), "—");
    assert.equal(computeConversionRate(0, 0), null);
    assert.equal(computeConversionRate(0, 5), 0);

    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "won",
        }),
        opp({
          _id: "o2",
          tenantId: "A",
          personaId: "p2",
          status: "handed_off",
          closedAt: "2026-09-05T00:00:00.000Z",
        }),
        opp({
          _id: "o3",
          tenantId: "A",
          personaId: "p3",
          status: "open",
        }),
      ],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.sales.conversion.cohort, 3);
    assert.equal(data.sales.conversion.won, 1);
    assert.equal(data.sales.conversion.handedOff, 1);
    assert.equal(data.sales.conversion.rate, 1 / 3);
    assert.equal(data.sales.closures.traspasadas, 1);
  });

  it("P/Q — Captación usa origen Persona; pérdidas usan origen Opp", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [
        persona({
          _id: "p1",
          tenantId: "A",
          origin: origin({ kind: "unknown", channel: "whatsapp" }),
        }),
        persona({
          _id: "p2",
          tenantId: "A",
          origin: origin({ kind: "manual" }),
        }),
      ],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "lost",
          closedAt: "2026-09-05T00:00:00.000Z",
          origin: origin({ kind: "admission" }),
        }),
      ],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.ok(data.acquisition.byOrigin.some((r) => r.label === "WhatsApp"));
    assert.ok(
      data.acquisition.byOrigin.some((r) => r.label === "Registro manual")
    );
    assert.ok(
      data.sales.losses.byOrigin.some((r) => r.label === "Admisión")
    );
  });

  it("R — campañas periodizadas por openedAt", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "won",
          origin: origin({ kind: "form", campaign: "open-day" }),
        }),
        opp({
          _id: "o2",
          tenantId: "A",
          personaId: "p2",
          status: "active",
          openedAt: "2025-01-01T00:00:00.000Z",
          origin: origin({ kind: "form", campaign: "open-day" }),
        }),
      ],
      campaigns: [
        campaign({
          _id: "c1",
          tenantId: "A",
          trackingKey: "open-day",
          name: "Open Day",
        }),
      ],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.equal(data.campaigns.length, 1);
    assert.equal(data.campaigns[0].name, "Open Day");
    assert.equal(data.campaigns[0].oportunidades, 1);
    assert.equal(data.campaigns[0].ganadas, 1);
    assert.equal(data.campaigns[0].personasCaptadas, 1);
    assert.equal(data.campaigns[0].conversionRate, 1);
    assert.doesNotMatch(JSON.stringify(data.campaigns), /open-day/);
  });

  it("T/U — mensajes inbound/outbound y personas distinct", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [],
      campaigns: [],
      conversations: [
        conv({ _id: "cv1", tenantId: "A", personaId: "p1" }),
        conv({ _id: "cv2", tenantId: "A", personaId: "p2" }),
      ],
      messages: [
        msg({
          _id: "m1",
          tenantId: "A",
          conversationId: "cv1",
          direction: "inbound",
        }),
        msg({
          _id: "m2",
          tenantId: "A",
          conversationId: "cv1",
          direction: "inbound",
          occurredAt: "2026-09-06T00:00:00.000Z",
        }),
        msg({
          _id: "m3",
          tenantId: "A",
          conversationId: "cv2",
          direction: "outbound",
        }),
        msg({
          _id: "m4",
          tenantId: "A",
          conversationId: "cv1",
          direction: "inbound",
          occurredAt: "2025-01-01T00:00:00.000Z",
        }),
      ],
      allTenantMessages: [],
    });
    assert.equal(data.messages.conversaciones, 2);
    assert.equal(data.messages.recibidos, 2);
    assert.equal(data.messages.enviados, 1);
    assert.equal(data.messages.personasQueEscribieron, 1);
    assert.ok(data.messages.byChannel.some((r) => r.label === "WhatsApp"));
  });

  it("V — conversaciones sin respuesta por último inbound (snapshot)", () => {
    const all = [
      msg({
        _id: "m1",
        tenantId: "A",
        conversationId: "cv1",
        direction: "inbound",
        occurredAt: "2026-09-10T00:00:00.000Z",
      }),
      msg({
        _id: "m2",
        tenantId: "A",
        conversationId: "cv2",
        direction: "inbound",
        occurredAt: "2026-09-01T00:00:00.000Z",
      }),
      msg({
        _id: "m3",
        tenantId: "A",
        conversationId: "cv2",
        direction: "outbound",
        occurredAt: "2026-09-02T00:00:00.000Z",
      }),
      msg({
        _id: "m4",
        tenantId: "B",
        conversationId: "cv3",
        direction: "inbound",
        occurredAt: "2026-09-10T00:00:00.000Z",
      }),
    ];
    assert.equal(countUnansweredConversations(all, "A"), 1);
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [],
      campaigns: [],
      conversations: [],
      messages: [],
      allTenantMessages: all,
    });
    assert.equal(data.messages.conversacionesSinRespuesta, 1);
  });

  it("W/X — pérdidas por tipo/origen/campaña + labels humanos", () => {
    assert.equal(
      acquisitionOriginGroupLabel(origin({ kind: "event" })),
      "Evento"
    );
    assert.equal(
      acquisitionOriginGroupLabel(
        origin({ kind: "form", formId: "f1" }),
        new Map([["f1", "Open Day Form"]])
      ),
      "Open Day Form"
    );

    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [],
      oportunidades: [
        opp({
          _id: "o1",
          tenantId: "A",
          personaId: "p1",
          status: "lost",
          typeKey: "inquiry",
          closedAt: "2026-09-05T00:00:00.000Z",
          origin: origin({ kind: "form", campaign: "camp-1" }),
        }),
        opp({
          _id: "o2",
          tenantId: "A",
          personaId: "p2",
          status: "lost",
          typeKey: "registration",
          closedAt: "2026-09-06T00:00:00.000Z",
          origin: origin({ kind: "manual" }),
        }),
      ],
      campaigns: [
        campaign({
          _id: "c1",
          tenantId: "A",
          trackingKey: "camp-1",
          name: "Campaña Alfa",
        }),
      ],
      conversations: [],
      messages: [],
      allTenantMessages: [],
    });
    assert.ok(data.sales.losses.byType.some((r) => r.label === "Consulta"));
    assert.ok(data.sales.losses.byType.some((r) => r.label === "Registro"));
    assert.ok(
      data.sales.losses.byCampaign.some((r) => r.label === "Campaña Alfa")
    );
    assert.ok(
      data.sales.losses.byCampaign.some((r) => r.label === "Sin campaña")
    );
    assert.doesNotMatch(JSON.stringify(data), /camp-1/);
    assert.doesNotMatch(JSON.stringify(data), /typeKey/);
  });
});

describe("OT-GROWTH-ANALYTICS-IMPLEMENT-003 — IAM / multi-tenant / empty", () => {
  it("Y — permiso growth.analytics.view en registry + catálogo + roles", () => {
    assert.equal(
      PERMISSIONS["growth.analytics.view"],
      "Ver Analítica del Espacio"
    );
    assert.equal(PERMISSIONS["growth.analytics.manage" as never], undefined);
    const growth = PERMISSION_MODULES.find((m) => m.id === "growth");
    assert.ok(
      growth?.permissions.some((p) => p.code === "growth.analytics.view")
    );
    assert.ok(
      !growth?.permissions.some((p) => p.code === "growth.analytics.manage")
    );

    for (const code of [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
    ]) {
      const role = PORTAL_TENANT_ROLES.find((r) => r.code === code);
      assert.ok(role?.permissionIds.includes("growth.analytics.view"), code);
      assert.equal(ROLE_PERMISSION_TEMPLATES[code]["growth.analytics.view"], true);
    }

    const map = legacyPermissionIdsToMap(["growth.analytics.view"]);
    assert.equal(map["growth.analytics.view"], true);
    const legacy = granularToLegacyPermissions({
      ...Object.fromEntries(
        Object.keys(ROLE_PERMISSION_TEMPLATES[ROLE_CODES.GUEST]).map((c) => [
          c,
          false,
        ])
      ),
      "growth.analytics.view": true,
    });
    assert.ok(legacy.includes("growth.analytics.view"));
  });

  it("Z — tenant A no ve tenant B", () => {
    const data = buildAnalyticsV1Response({
      tenantId: "A",
      period: period30,
      personas: [
        persona({ _id: "pA", tenantId: "A" }),
        persona({ _id: "pB", tenantId: "B" }),
      ],
      oportunidades: [
        opp({
          _id: "oA",
          tenantId: "A",
          personaId: "pA",
          status: "won",
          closedAt: "2026-09-05T00:00:00.000Z",
        }),
        opp({
          _id: "oB",
          tenantId: "B",
          personaId: "pB",
          status: "won",
          closedAt: "2026-09-05T00:00:00.000Z",
        }),
      ],
      campaigns: [
        campaign({
          _id: "cB",
          tenantId: "B",
          trackingKey: "x",
          name: "Otra",
        }),
      ],
      conversations: [
        conv({ _id: "cvB", tenantId: "B", personaId: "pB" }),
      ],
      messages: [
        msg({
          _id: "mB",
          tenantId: "B",
          conversationId: "cvB",
          direction: "inbound",
        }),
      ],
      allTenantMessages: [
        msg({
          _id: "mB2",
          tenantId: "B",
          conversationId: "cvB",
          direction: "inbound",
        }),
      ],
    });
    assert.equal(data.summary.personasNuevas, 1);
    assert.equal(data.summary.ganadas, 1);
    assert.equal(data.campaigns.length, 0);
    assert.equal(data.messages.recibidos, 0);
    assert.equal(data.messages.conversacionesSinRespuesta, 0);
  });

  it("AA — espacio vacío válido", () => {
    const data = emptyAnalyticsV1Response(period30);
    assert.equal(data.summary.personasNuevas, 0);
    assert.equal(data.sales.conversion.rate, null);
    assert.deepEqual(data.campaigns, []);
    assert.deepEqual(data.acquisition.byOrigin, []);
    assert.deepEqual(data.messages.byChannel, []);
  });

  it("nav Analítica apunta a /admin/analitica con permiso", () => {
    const nav = readSrc("src/lib/admin/nav-domains.ts");
    assert.match(
      nav,
      /id: "nav-analitica"[\s\S]*?href: "\/admin\/analitica"/
    );
    assert.match(nav, /growth\.analytics\.view/);
    const master = readSrc(
      "src/components/admin/preview/growth-os-master/master-nav.ts"
    );
    assert.match(master, /href: "\/admin\/analitica"/);
  });

  it("índices Analítica documentados en indexes.ts + migración 022", () => {
    const indexes = readSrc("src/core/growth/indexes.ts");
    assert.match(indexes, /tenantId_createdAt/);
    assert.match(indexes, /tenantId_openedAt/);
    assert.match(indexes, /tenantId_status_openedAt/);
    assert.match(indexes, /tenantId_closedAt/);
    assert.match(indexes, /tenantId_originCampaign_openedAt/);
    const registry = readSrc("src/core/migrations/registry.ts");
    assert.match(registry, /022-growth-analytics/);
  });
});
