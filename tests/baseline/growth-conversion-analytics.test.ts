/**
 * Conversion Engine fase 3 — núcleo puro de analítica de conversión.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONVERSION_DENOMINATORS,
  CONVERSION_LOSS_REASONS_NOTE,
  CONVERSION_RATE_NOTE,
  buildConversionAnalytics,
  type BuildConversionAnalyticsInput,
  type ConversionActivityInput,
  type ConversionOpportunityInput,
} from "../../src/lib/growth/conversion-analytics";
import { computeConversionRate } from "../../src/lib/growth/analytics-aggregate";
import { resolveAnalyticsPeriod } from "../../src/lib/growth/analytics-period";

const READ_AT = "2026-09-11T15:00:00.000Z";
const PERIOD_RESULT = resolveAnalyticsPeriod({
  preset: "last_30d",
  now: new Date(READ_AT),
});
assert.ok(PERIOD_RESULT.ok);
const period = PERIOD_RESULT.period;

const T1 = "tenant-1";
const T2 = "tenant-2";
const DAY = 86_400_000;

function origin(
  partial: { kind?: string; channel?: string; formId?: string; campaign?: string } = {}
) {
  return { kind: "form", ...partial };
}

function opp(
  partial: Partial<ConversionOpportunityInput> &
    Pick<ConversionOpportunityInput, "_id">
): ConversionOpportunityInput {
  return {
    tenantId: T1,
    status: "open",
    openedAt: "2026-09-05T12:00:00.000Z",
    origin: origin(),
    funnelKey: "ventas",
    ...partial,
  };
}

function activity(
  partial: Partial<ConversionActivityInput> &
    Pick<ConversionActivityInput, "_id" | "kind">
): ConversionActivityInput {
  return {
    tenantId: T1,
    occurredAt: "2026-09-06T12:00:00.000Z",
    ...partial,
  };
}

function transition(
  id: string,
  oportunidadId: string,
  fromState: string | undefined,
  toState: string | undefined,
  occurredAt = "2026-09-06T12:00:00.000Z",
  extra: Partial<ConversionActivityInput> = {}
): ConversionActivityInput {
  const payload: Record<string, unknown> = {};
  if (fromState !== undefined) payload.fromState = fromState;
  if (toState !== undefined) payload.toState = toState;
  return activity({
    _id: id,
    kind: "opportunity_transitioned",
    oportunidadId,
    occurredAt,
    payload,
    ...extra,
  });
}

function opened(
  id: string,
  oportunidadId: string,
  status: string,
  occurredAt: string
): ConversionActivityInput {
  return activity({
    _id: id,
    kind: "opportunity_opened",
    oportunidadId,
    occurredAt,
    payload: { status },
  });
}

function assigned(
  id: string,
  oportunidadId: string,
  toUserId: string | undefined,
  occurredAt: string
): ConversionActivityInput {
  return activity({
    _id: id,
    kind: "opportunity_assigned",
    oportunidadId,
    occurredAt,
    payload: toUserId === undefined ? {} : { toUserId },
  });
}

function build(partial: Partial<BuildConversionAnalyticsInput>) {
  return buildConversionAnalytics({
    tenantId: T1,
    period,
    readAt: READ_AT,
    opportunities: [],
    activities: [],
    funnels: [
      {
        tenantId: T1,
        key: "ventas",
        stages: [
          { key: "nuevo", label: "Nuevo" },
          { key: "propuesta", label: "Propuesta" },
        ],
      },
    ],
    campaigns: [],
    members: [],
    ...partial,
  });
}

const sum = (rows: Array<{ count: number }>) =>
  rows.reduce((acc, r) => acc + r.count, 0);

describe("buildConversionAnalytics — aislamiento por Espacio", () => {
  it("una oportunidad de otro tenantId no cambia captación, cohortes ni responsables", () => {
    const base = {
      opportunities: [
        opp({
          _id: "a",
          ownerUserId: "ana",
          origin: origin({ campaign: "verano" }),
        }),
      ],
      campaigns: [
        { tenantId: T1, _id: "c1", name: "Verano", trackingKey: "verano" },
      ],
      members: [{ userId: "ana", label: "Ana", active: true }],
    };
    const alone = build(base);
    const withForeign = build({
      ...base,
      opportunities: [
        ...base.opportunities,
        opp({
          _id: "x",
          tenantId: T2,
          ownerUserId: "ana",
          origin: origin({ campaign: "verano" }),
        }),
      ],
      activities: [
        transition("t-x", "x", "nuevo", "propuesta", "2026-09-07T12:00:00.000Z", {
          tenantId: T2,
        }),
      ],
    });
    assert.equal(withForeign.captacion.total, alone.captacion.total);
    assert.deepEqual(withForeign.cohorts, alone.cohorts);
    assert.deepEqual(withForeign.owners, alone.owners);
    assert.deepEqual(withForeign.movement, alone.movement);
    assert.equal(withForeign.captacion.total, 1);
  });
});

describe("buildConversionAnalytics — captación", () => {
  const three = [
    opp({
      _id: "a",
      funnelKey: "ventas",
      origin: origin({ kind: "message", channel: "whatsapp" }),
    }),
    opp({
      _id: "b",
      funnelKey: "admision",
      origin: origin({ kind: "form" }),
    }),
    opp({ _id: "c", funnelKey: undefined, origin: null }),
  ];

  it("total es la suma de cortes por embudo y por origen", () => {
    const r = build({ opportunities: three });
    assert.equal(r.captacion.total, 3);
    assert.equal(sum(r.captacion.byFunnel), 3);
    assert.equal(sum(r.captacion.byOrigin), 3);
    assert.ok(r.captacion.byFunnel.some((x) => x.label === "Sin embudo"));
    assert.ok(r.captacion.byOrigin.some((x) => x.label === "Sin origen claro"));
    assert.equal(r.captacion.archivedNow, 0);
    assert.equal(r.denominators.captacion, CONVERSION_DENOMINATORS.captacion);
  });

  it("una alta archivada después cuenta en captación y no en la cohorte", () => {
    const r = build({
      opportunities: [
        ...three,
        opp({ _id: "d", status: "archived" }),
      ],
    });
    assert.equal(r.captacion.total, 4);
    assert.equal(r.captacion.archivedNow, 1);
    assert.equal(sum(r.captacion.byFunnel), 4);
    const cohortTotal = r.cohorts.byFunnel.reduce((a, x) => a + x.cohort, 0);
    assert.equal(cohortTotal, 3);
  });

  it("sin openedAt no es alta y va al cubo de calidad", () => {
    const r = build({
      opportunities: [...three, opp({ _id: "e", openedAt: undefined })],
    });
    assert.equal(r.captacion.total, 3);
    assert.equal(r.quality.sinFechaApertura, 1);
  });
});

describe("buildConversionAnalytics — stock y movimiento", () => {
  it("stock ignora el período; movimiento ilegible no mueve otra barra", () => {
    const r = build({
      opportunities: [
        opp({
          _id: "old",
          status: "propuesta",
          openedAt: "2026-01-01T00:00:00.000Z",
        }),
        opp({ _id: "won-old", status: "won", openedAt: "2026-01-01T00:00:00.000Z" }),
      ],
      activities: [
        transition("t-out", "old", "nuevo", "propuesta", "2026-02-01T00:00:00.000Z"),
        transition("t-bad", "old", undefined, "propuesta"),
      ],
    });
    const stock = r.stock.byFunnel.find((f) => f.funnelKey === "ventas");
    assert.ok(stock);
    assert.deepEqual(
      stock.stages.map((s) => [s.key, s.label, s.count]),
      [["propuesta", "Propuesta", 1]]
    );
    assert.equal(r.captacion.total, 0);
    assert.equal(r.quality.movimientoIlegible, 1);
    assert.equal(r.movement.ilegible, 1);
    assert.equal(r.movement.byFunnel.length, 0);
  });

  it("clasifica avance, abandono, ganada, traspaso y archivo; asignar no avanza", () => {
    const r = build({
      opportunities: [
        opp({ _id: "a" }),
        opp({ _id: "b" }),
        opp({ _id: "c" }),
      ],
      activities: [
        transition("t1", "a", "nuevo", "propuesta"),
        transition("t2", "a", "nuevo", "lost"),
        transition("t3", "b", "nuevo", "won"),
        transition("t4", "b", "nuevo", "handed_off"),
        transition("t5", "c", "nuevo", "archived"),
        assigned("as1", "a", "ana", "2026-09-07T12:00:00.000Z"),
      ],
    });
    const f = r.movement.byFunnel.find((x) => x.funnelKey === "ventas");
    assert.ok(f);
    const row = f.stages.find((s) => s.key === "nuevo");
    assert.ok(row);
    assert.equal(row.advance, 1);
    assert.equal(row.lost, 1);
    assert.equal(row.won, 1);
    assert.equal(row.handedOff, 1);
    assert.equal(row.archived, 1);
    assert.equal(row.opportunities, 3);
  });

  it("handed_off con closedAt en el período sube traspaso y no ganadas ni perdidas", () => {
    const r = build({
      opportunities: [
        opp({
          _id: "h",
          status: "handed_off",
          closedAt: "2026-09-08T12:00:00.000Z",
        }),
      ],
    });
    assert.equal(r.closures.handedOff, 1);
    assert.equal(r.closures.won, 0);
    assert.equal(r.closures.lost, 0);
  });
});

describe("buildConversionAnalytics — cierres y cohortes", () => {
  it("won sin closedAt va a calidad y no altera la tasa", () => {
    const withClosed = build({
      opportunities: [
        opp({ _id: "w", status: "won", closedAt: "2026-09-08T12:00:00.000Z" }),
        opp({ _id: "o", status: "open" }),
      ],
    });
    const withBroken = build({
      opportunities: [
        opp({ _id: "w", status: "won", closedAt: "2026-09-08T12:00:00.000Z" }),
        opp({ _id: "o", status: "open" }),
        opp({ _id: "w2", status: "won" }),
      ],
    });
    assert.equal(withBroken.quality.sinFechaCierre, 1);
    assert.equal(withBroken.closures.won, 1);
    assert.deepEqual(withBroken.cohorts.byFunnel, withClosed.cohorts.byFunnel);
  });

  it("cohorte vacía no tiene fila y su tasa es null", () => {
    const r = build({ opportunities: [] });
    assert.equal(r.cohorts.byFunnel.length, 0);
    assert.equal(r.cohorts.bySource.length, 0);
    assert.equal(computeConversionRate(0, 0), null);
  });

  it("cohorte de 2 con una ganada y una abierta tiene tasa 0.5", () => {
    const r = build({
      opportunities: [
        opp({ _id: "w", status: "won", closedAt: "2026-09-08T12:00:00.000Z" }),
        opp({ _id: "o", status: "open" }),
      ],
    });
    const row = r.cohorts.byFunnel.find((x) => x.key === "ventas");
    assert.ok(row);
    assert.equal(row.cohort, 2);
    assert.equal(row.won, 1);
    assert.equal(row.open, 1);
    assert.equal(row.rate, 0.5);
    assert.equal(r.rateNote, CONVERSION_RATE_NOTE);
    assert.equal(r.denominators.cohorte, CONVERSION_DENOMINATORS.cohorte);
  });

  it("handed_off entra en cohorte y handedOff, no en won", () => {
    const r = build({
      opportunities: [
        opp({
          _id: "h",
          status: "handed_off",
          closedAt: "2026-09-08T12:00:00.000Z",
        }),
      ],
    });
    const row = r.cohorts.byFunnel[0];
    assert.equal(row.cohort, 1);
    assert.equal(row.handedOff, 1);
    assert.equal(row.won, 0);
    assert.equal(row.rate, 0);
  });
});

describe("buildConversionAnalytics — pérdidas", () => {
  it("cuenta etapa de salida, conserva pérdidas sin etapa y no registra motivos", () => {
    const r = build({
      opportunities: [
        opp({ _id: "l1", status: "lost", closedAt: "2026-09-08T12:00:00.000Z" }),
        opp({ _id: "l2", status: "lost", closedAt: "2026-09-08T12:00:00.000Z" }),
      ],
      activities: [
        transition("t1", "l1", "propuesta", "lost", "2026-09-08T11:00:00.000Z", {
          summary: "precio",
        }),
      ],
    });
    assert.equal(r.losses.total, 2);
    assert.equal(r.losses.byExitStage.length, 1);
    assert.equal(r.losses.byExitStage[0].label, "Propuesta");
    assert.equal(r.losses.byExitStage[0].count, 1);
    assert.ok(r.losses.byExitStage.every((x) => x.label !== "precio"));
    assert.equal(r.quality.etapaDeSalidaNoRegistrada, 1);
    assert.equal(r.losses.reasonsRecorded, false);
    assert.equal(r.losses.reasonsNote, CONVERSION_LOSS_REASONS_NOTE);
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/growth/conversion-analytics.ts"),
      "utf8"
    );
    assert.ok(!src.includes("lossReasonKey"));
  });

  it("transiciones a lost posteriores a closedAt no definen la etapa de salida", () => {
    const r = build({
      opportunities: [
        opp({ _id: "l", status: "lost", closedAt: "2026-09-08T12:00:00.000Z" }),
      ],
      activities: [
        transition("t1", "l", "nuevo", "lost", "2026-09-08T11:00:00.000Z"),
        transition("t2", "l", "propuesta", "lost", "2026-09-09T11:00:00.000Z"),
      ],
    });
    assert.equal(r.losses.byExitStage.length, 1);
    assert.equal(r.losses.byExitStage[0].label, "Nuevo");
  });
});

describe("buildConversionAnalytics — permanencia y ciclo", () => {
  const nuevoOpened = (id: string, at: string) =>
    opened(`op-${id}`, id, "nuevo", at);

  it("mediana de intervalos terminados; en curso e historial incompleto no cuentan", () => {
    const r = build({
      opportunities: [
        opp({ _id: "a", status: "propuesta", openedAt: "2026-08-20T00:00:00.000Z" }),
        opp({ _id: "b", status: "propuesta", openedAt: "2026-08-20T00:00:00.000Z" }),
        opp({ _id: "c", status: "nuevo", openedAt: "2026-09-01T00:00:00.000Z" }),
        opp({ _id: "d", status: "nuevo", openedAt: "2026-08-20T00:00:00.000Z" }),
      ],
      activities: [
        nuevoOpened("a", "2026-08-20T00:00:00.000Z"),
        transition("ta", "a", "nuevo", "propuesta", "2026-08-22T00:00:00.000Z"),
        nuevoOpened("b", "2026-08-20T00:00:00.000Z"),
        transition("tb", "b", "nuevo", "propuesta", "2026-08-24T00:00:00.000Z"),
        nuevoOpened("c", "2026-09-01T00:00:00.000Z"),
        nuevoOpened("d", "2026-08-20T00:00:00.000Z"),
        transition("td", "d", "nuevo", "propuesta", "2026-08-23T00:00:00.000Z"),
      ],
    });
    const funnel = r.dwell.byFunnel.find((f) => f.funnelKey === "ventas");
    assert.ok(funnel);
    const nuevo = funnel.stages.find((s) => s.key === "nuevo");
    assert.ok(nuevo);
    assert.equal(nuevo.medianMs, 3 * DAY);
    assert.equal(nuevo.count, 2);
    assert.equal(nuevo.inProgress, 1);
    assert.equal(r.quality.historialIncompleto, 1);
    const stock = r.stock.byFunnel.find((f) => f.funnelKey === "ventas");
    assert.ok(stock);
    assert.equal(stock.stages.find((s) => s.key === "nuevo")?.count, 2);
  });

  it("ciclo de ganadas y perdidas se calcula por separado", () => {
    const r = build({
      opportunities: [
        opp({
          _id: "w",
          status: "won",
          openedAt: "2026-09-01T00:00:00.000Z",
          closedAt: "2026-09-06T00:00:00.000Z",
        }),
        opp({
          _id: "l",
          status: "lost",
          openedAt: "2026-09-02T00:00:00.000Z",
          closedAt: "2026-09-03T00:00:00.000Z",
        }),
      ],
    });
    assert.equal(r.cycle.won.medianMs, 5 * DAY);
    assert.equal(r.cycle.won.count, 1);
    assert.equal(r.cycle.lost.medianMs, 1 * DAY);
    assert.equal(r.cycle.lost.count, 1);
  });
});

describe("buildConversionAnalytics — campaña y fuente", () => {
  it("atribuye solo por trackingKey del Espacio y no lee referrer", () => {
    const r = build({
      opportunities: [
        opp({ _id: "a", origin: origin({ campaign: " verano " }) }),
        opp({ _id: "b", origin: origin({ campaign: "desconocida" }) }),
        opp({ _id: "c", origin: origin({ campaign: undefined }) }),
        opp({ _id: "d", origin: null }),
      ],
      activities: [
        activity({
          _id: "ref",
          kind: "opportunity_opened",
          oportunidadId: "c",
          payload: { referrer: "verano", status: "nuevo" },
        }),
      ],
      campaigns: [
        { tenantId: T1, _id: "c1", name: "Verano", trackingKey: "verano" },
        { tenantId: T2, _id: "c2", name: "Otra", trackingKey: "desconocida" },
      ],
    });
    const names = r.cohorts.byCampaign.map((x) => [x.label, x.cohort]);
    assert.deepEqual(
      names.sort((a, b) => String(a[0]).localeCompare(String(b[0]), "es")),
      [
        ["Campaña no registrada", 1],
        ["Verano", 1],
      ]
    );
    assert.equal(r.quality.campanaNoRegistrada, 1);
    const sources = r.cohorts.bySource.map((x) => x.label);
    assert.ok(sources.includes("Sin origen claro"));
  });
});

describe("buildConversionAnalytics — responsables", () => {
  const members = [
    { userId: "ana", label: "Ana", active: true },
    { userId: "bruno", label: "Bruno", active: false },
  ];

  it("abierta suma en el ownerUserId vigente", () => {
    const r = build({
      opportunities: [opp({ _id: "a", ownerUserId: "ana" }), opp({ _id: "b" })],
      members,
    });
    const ana = r.owners.find((o) => o.userId === "ana");
    assert.equal(ana?.label, "Ana");
    assert.equal(ana?.open, 1);
    const none = r.owners.find((o) => o.label === "Sin responsable");
    assert.equal(none?.userId, null);
    assert.equal(none?.open, 1);
  });

  it("cierre atribuye a la última asignación anterior o igual a closedAt", () => {
    const closedAt = "2026-09-08T12:00:00.000Z";
    const r = build({
      opportunities: [
        opp({ _id: "w1", status: "won", closedAt, ownerUserId: "ana" }),
        opp({ _id: "w2", status: "won", closedAt, ownerUserId: "ana" }),
        opp({ _id: "w3", status: "won", closedAt, ownerUserId: "ana" }),
      ],
      activities: [
        assigned("a1", "w1", "ana", "2026-09-06T12:00:00.000Z"),
        assigned("a2", "w1", "", "2026-09-07T12:00:00.000Z"),
        assigned("a3", "w2", "bruno", "2026-09-07T12:00:00.000Z"),
        assigned("a4", "w2", "ana", "2026-09-09T12:00:00.000Z"),
      ],
      members,
    });
    const noAttr = r.owners.find((o) => o.label === "Sin atribución de responsable");
    assert.equal(noAttr?.userId, null);
    assert.equal(noAttr?.won, 2);
    const bruno = r.owners.find((o) => o.userId === "bruno");
    assert.equal(bruno?.label, "Responsable no vigente");
    assert.equal(bruno?.won, 1);
    const ana = r.owners.find((o) => o.userId === "ana");
    assert.equal(ana?.won ?? 0, 0);
    assert.equal(ana?.open ?? 0, 0);
  });

  it("usuario sin membresía queda como Responsable no vigente", () => {
    const r = build({
      opportunities: [opp({ _id: "a", ownerUserId: "fantasma" })],
      members,
    });
    assert.equal(r.owners[0].label, "Responsable no vigente");
    assert.equal(r.owners[0].userId, "fantasma");
  });
});

describe("buildConversionAnalytics — calidad de datos", () => {
  it("los cubos de calidad son números y no filas de etapa, origen ni responsable", () => {
    const r = build({
      opportunities: [
        opp({ _id: "a", openedAt: undefined }),
        opp({ _id: "b", status: "won" }),
        opp({ _id: "c", origin: origin({ campaign: "zzz" }) }),
      ],
      activities: [transition("t", "c", undefined, "propuesta")],
    });
    for (const key of [
      "sinFechaApertura",
      "sinFechaCierre",
      "historialIncompleto",
      "movimientoIlegible",
      "campanaNoRegistrada",
      "etapaDeSalidaNoRegistrada",
    ] as const) {
      assert.equal(typeof r.quality[key], "number");
    }
    const qualityLabels = [
      "Sin fecha de apertura",
      "Sin fecha de cierre",
      "Historial incompleto",
      "Movimiento ilegible",
      "Campaña no registrada",
      "Etapa de salida no registrada",
    ];
    const labels = [
      ...r.stock.byFunnel.flatMap((f) => f.stages.map((s) => s.label)),
      ...r.captacion.byOrigin.map((x) => x.label),
      ...r.owners.map((o) => o.label),
    ];
    for (const q of qualityLabels) {
      assert.ok(!labels.includes(q), q);
    }
    assert.equal(r.quality.sinFechaApertura, 1);
    assert.equal(r.quality.sinFechaCierre, 1);
    assert.equal(r.quality.movimientoIlegible, 1);
  });
});

describe("conversion-analytics-read — guarda de fuente", () => {
  const read = readFileSync(
    resolve(process.cwd(), "src/lib/growth/conversion-analytics-read.ts"),
    "utf8"
  );

  it("es server-only y filtra por tenantId", () => {
    assert.match(read, /import "server-only"/);
    assert.match(read, /\{\s*tenantId\s*\}/);
    assert.match(read, /tenantId,\s*kind:\s*\{\s*\$in:/);
  });

  it("lee solo los kinds de movimiento necesarios", () => {
    const kinds = read.match(/"opportunity_[a-z_]+"/g) ?? [];
    assert.deepEqual([...new Set(kinds)].sort(), [
      '"opportunity_assigned"',
      '"opportunity_opened"',
      '"opportunity_transitioned"',
    ]);
  });

  it("no escribe, no migra y no toca métricas de campaña", () => {
    for (const forbidden of [
      /insert/i,
      /update/i,
      /delete/i,
      /aggregate/i,
      /replaceOne/,
      /bulkWrite/,
      /createIndex/,
      /029/,
      /lossReason/,
      /deriveCampaignMetrics/,
    ]) {
      assert.doesNotMatch(read, forbidden, String(forbidden));
    }
  });

  it("la analítica previa no importa conversion-analytics", () => {
    for (const file of [
      "src/lib/growth/analytics-read.ts",
      "src/lib/growth/analytics-aggregate.ts",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.doesNotMatch(source, /conversion-analytics/, file);
    }
  });

  it("la lectura server-only no se reexporta desde el índice de Growth", () => {
    const index = readFileSync(
      resolve(process.cwd(), "src/lib/growth/index.ts"),
      "utf8"
    );
    assert.doesNotMatch(index, /conversion-analytics-read/);
  });
});


describe("Conversion Engine fase 3 — pantalla, ruta y navegación (guardas de fuente)", () => {
  const src = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

  it("Analítica V1 no cambia", () => {
    const page = src("src/app/admin/analitica/page.tsx");
    assert.match(page, /getAnalyticsV1/);
    assert.match(page, /growth\.analytics\.view/);
    assert.doesNotMatch(page, /conversion-analytics/);
    assert.doesNotMatch(page, /etapa/);
  });

  it("el panel comercial no importa el cliente de analítica", () => {
    const path = resolve(process.cwd(), "src/app/admin/conversion/page.tsx");
    if (!existsSync(path)) return;
    assert.doesNotMatch(readFileSync(path, "utf8"), /ConversionAnaliticaClient/);
  });

  it("nav: ítem nuevo después de nav-conversion con permiso exacto", () => {
    const nav = src("src/lib/admin/nav-domains.ts");
    const panelIdx = nav.indexOf('id: "nav-conversion"');
    const itemIdx = nav.indexOf('id: "nav-conversion-analitica"');
    assert.ok(panelIdx >= 0, "nav-conversion");
    assert.ok(itemIdx > panelIdx, "nav-conversion-analitica después de nav-conversion");
    const panelBlock = nav.slice(panelIdx, itemIdx);
    assert.match(
      panelBlock,
      /excludePrefixes:\s*\[[^\]]*"\/admin\/conversion\/analitica"/
    );
    const item = nav.slice(itemIdx, nav.indexOf("},", itemIdx));
    assert.match(item, /href: "\/admin\/conversion\/analitica"/);
    assert.match(item, /label: "Analítica de conversión"/);
    assert.match(item, /requiredAnyPermission: \["growth\.sales\.view"\]/);
    const groupIdx = nav.lastIndexOf('id: "conversion"', itemIdx);
    const nextGroup = nav.indexOf('\n    id: "', itemIdx);
    assert.ok(groupIdx >= 0 && groupIdx < itemIdx);
    assert.ok(nextGroup > itemIdx);
  });

  it("la página nueva exige growth.sales.view y redirige al login", () => {
    const page = src("src/app/admin/conversion/analitica/page.tsx");
    assert.match(page, /growth\.sales\.view/);
    assert.doesNotMatch(page, /growth\.analytics\.view/);
    assert.match(page, /\/login\?next=\/admin\/conversion\/analitica/);
    assert.match(page, /getConversionAnalytics/);
  });

  it("la ruta API usa growth.sales.view", () => {
    const route = src("src/app/api/growth/conversion-analytics/route.ts");
    assert.match(route, /requirePermission\("growth\.sales\.view"\)/);
    assert.doesNotMatch(route, /growth\.analytics\.view/);
    assert.match(route, /getConversionAnalytics/);
  });

  it("el cliente muestra copy contractual, una columna, sin motivos ni series de ejemplo", () => {
    const client = src("src/components/admin/growth/ConversionAnaliticaClient.tsx");
    assert.match(client, /CONVERSION_DENOMINATORS/);
    assert.match(client, /CONVERSION_RATE_NOTE/);
    assert.match(client, /CONVERSION_LOSS_REASONS_NOTE/);
    assert.match(client, /Sin datos en el período/);
    assert.match(client, /data-conversion-analitica/);
    assert.match(client, /flex flex-col|grid-cols-1/);
    assert.match(client, /\/api\/growth\/conversion-analytics/);
    assert.doesNotMatch(client, /lossReason/);
    assert.doesNotMatch(client, /\/api\/growth\/analytics/);
    assert.doesNotMatch(client, /sample|ejemplo|mock/i);
  });

  it("AnaliticaClient usa las piezas extraídas y conserva su fetch", () => {
    const visual = src("src/components/admin/growth/analitica-visual.tsx");
    for (const name of ["StorySection", "HeroMetric", "ProportionBars", "PeriodSelector"]) {
      assert.match(visual, new RegExp(`export function ${name}`));
    }
    const client = src("src/components/admin/growth/AnaliticaClient.tsx");
    assert.match(client, /analitica-visual/);
    assert.match(client, /\/api\/growth\/analytics/);
    assert.doesNotMatch(client, /function StorySection|function PeriodSelector/);
  });
});
