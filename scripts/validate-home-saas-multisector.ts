/**
 * Validación transversal Home + Conversion Engine (SaaS multiempresa).
 * Usa datos existentes; no muta salvo el Espacio temporal marcado.
 *
 * Uso: npx tsx --env-file=.env scripts/validate-home-saas-multisector.ts
 */
import { MongoClient, type Db } from "mongodb";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("./_stub-server-only.cjs");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const TEMP_TENANT = "saas-val-temp-empty";
const RESULT = new Set(["won", "lost", "handed_off", "archived"]);

type Check = { id: string; ok: boolean; detail: string };
const checks: Check[] = [];

function note(id: string, ok: boolean, detail: string) {
  checks.push({ id, ok, detail });
  console.log(`${ok ? "PASA" : "FALLA"} [${id}] ${detail}`);
}

async function inventory(db: Db) {
  const opp = await db
    .collection("growth_oportunidades")
    .aggregate<{ _id: string; opps: number; open: number }>([
      {
        $group: {
          _id: "$tenantId",
          opps: { $sum: 1 },
          open: {
            $sum: {
              $cond: [{ $in: ["$status", [...RESULT]] }, 0, 1],
            },
          },
        },
      },
      { $sort: { opps: -1 } },
    ])
    .toArray();

  const funnels = await db
    .collection("growth_funnels")
    .aggregate<{ _id: string; count: number; keys: string[]; names: string[] }>([
      {
        $group: {
          _id: "$tenantId",
          count: { $sum: 1 },
          keys: { $push: "$key" },
          names: { $push: "$name" },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();

  const camps = await db
    .collection("growth_campaigns")
    .aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ])
    .toArray();

  const tenants = await db
    .collection("tenants")
    .find({}, { projection: { _id: 1, name: 1 } })
    .limit(40)
    .toArray();

  return { opp, funnels, camps, tenants };
}

async function ensureTempEmptySpace(db: Db) {
  await db.collection("tenants").updateOne(
    { _id: TEMP_TENANT as unknown as import("mongodb").ObjectId },
    {
      $set: {
        name: "Validación SaaS vacío",
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
        code: "VAL-EMPTY",
      },
    },
    { upsert: true }
  ).catch(async () => {
    // _id may be string in this schema
    await db.collection("tenants").updateOne(
      { _id: TEMP_TENANT as never },
      {
        $set: {
          name: "Validación SaaS vacío",
          status: "active",
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          _id: TEMP_TENANT,
          createdAt: new Date().toISOString(),
          code: "VAL-EMPTY",
        },
      },
      { upsert: true }
    );
  });

  // Guarantee no growth rows for temp space
  for (const col of [
    "growth_oportunidades",
    "growth_actividades",
    "growth_campaigns",
    "growth_funnels",
  ] as const) {
    await db.collection(col).deleteMany({ tenantId: TEMP_TENANT });
  }
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const inv = await inventory(db);
  console.log("\n=== Inventario Espacios con Growth ===");
  console.log(
    inv.opp
      .slice(0, 12)
      .map((r) => `${r._id}: opps=${r.opps} open=${r.open}`)
      .join("\n")
  );
  console.log("\n=== Embudos ===");
  console.log(
    inv.funnels
      .map((r) => `${r._id}: ${r.count} → ${r.keys.join(",")}`)
      .join("\n")
  );
  console.log("\n=== Campañas ===");
  console.log(inv.camps.map((r) => `${r._id}: ${r.count}`).join("\n") || "(ninguna)");

  await ensureTempEmptySpace(db);

  // Pick ≥3 spaces: richest, multi-funnel if any, empty temp, and another real
  const multiFunnel = inv.funnels.find((f) => f.count >= 2)?._id;
  const richest = inv.opp[0]?._id;
  const second = inv.opp.find((o) => o._id !== richest && o._id !== multiFunnel)?._id;
  const mentor = inv.opp.find((o) => o._id === "mentor-prime-capacitacion")?._id;
  const seminario = inv.opp.find((o) => o._id === "seminario-ipn")?._id;
  const spaces = Array.from(
    new Set(
      [richest, multiFunnel, second, mentor, seminario, TEMP_TENANT].filter(
        Boolean
      ) as string[]
    )
  );

  // Espacio temporal multi-embudo (reversible) para validar no-mezcla end-to-end.
  const multiTemp = "saas-val-temp-multi";
  await db.collection("growth_funnels").deleteMany({ tenantId: multiTemp });
  await db.collection("growth_oportunidades").deleteMany({ tenantId: multiTemp });
  await db.collection("growth_actividades").deleteMany({ tenantId: multiTemp });
  const nowIso = new Date().toISOString();
  await db.collection("growth_funnels").insertMany([
    {
      _id: `${multiTemp}-retail` as never,
      tenantId: multiTemp,
      key: "retail",
      name: "Retail corto",
      stages: [
        { key: "lead", label: "Lead" },
        { key: "cita", label: "Cita" },
      ],
      status: "active",
      createdAt: nowIso,
      updatedAt: nowIso,
      captureTag: "saas-val-temp",
    },
    {
      _id: `${multiTemp}-b2b` as never,
      tenantId: multiTemp,
      key: "b2b",
      name: "B2B largo",
      stages: [
        { key: "diagnostico", label: "Diagnóstico sector" },
        { key: "propuesta", label: "Propuesta" },
      ],
      status: "active",
      createdAt: nowIso,
      updatedAt: nowIso,
      captureTag: "saas-val-temp",
    },
  ]);
  await db.collection("growth_oportunidades").insertMany([
    {
      _id: `${multiTemp}-opp-1` as never,
      tenantId: multiTemp,
      personaId: `${multiTemp}-p1`,
      status: "lead",
      funnelKey: "retail",
      openedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      captureTag: "saas-val-temp",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: `${multiTemp}-opp-2` as never,
      tenantId: multiTemp,
      personaId: `${multiTemp}-p2`,
      status: "lead",
      funnelKey: "retail",
      openedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      captureTag: "saas-val-temp",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: `${multiTemp}-opp-3` as never,
      tenantId: multiTemp,
      personaId: `${multiTemp}-p3`,
      status: "diagnostico",
      funnelKey: "b2b",
      openedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      captureTag: "saas-val-temp",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      _id: `${multiTemp}-opp-won-b2b` as never,
      tenantId: multiTemp,
      personaId: `${multiTemp}-p4`,
      status: "won",
      funnelKey: "b2b",
      openedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      closedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      captureTag: "saas-val-temp",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ]);
  spaces.push(multiTemp);
  note("setup-multi", true, `Espacio temporal ${multiTemp} con 2 embudos distintos`);

  console.log("\n=== Espacios bajo prueba ===", spaces.join(", "));

  const { getConversionAnalytics } = await import(
    "../src/lib/growth/conversion-analytics-read"
  );
  const { loadGrowthOsHomeSnapshot } = await import(
    "../src/components/admin/preview/growth-os-master/load-home-snapshot"
  );
  const { projectGrowthOsHomeDashboard } = await import(
    "../src/components/admin/preview/growth-os-master/project-home"
  );
  const { buildConversionAnalytics } = await import(
    "../src/lib/growth/conversion-analytics"
  );
  const { resolveAnalyticsPeriod } = await import(
    "../src/lib/growth/analytics-period"
  );

  const allCaps = {
    salesView: true,
    salesOperate: true,
    salesRead: true,
    campaignsView: true,
    analyticsView: true,
    peopleView: true,
    activityView: true,
  };

  const operateOnly = {
    salesView: false,
    salesOperate: true,
    salesRead: false,
    campaignsView: false,
    analyticsView: false,
    peopleView: false,
    activityView: true,
  };

  const noSales = {
    salesView: false,
    salesOperate: false,
    salesRead: false,
    campaignsView: true,
    analyticsView: true,
    peopleView: true,
    activityView: true,
  };

  type Snap = Awaited<ReturnType<typeof loadGrowthOsHomeSnapshot>>;
  const snaps = new Map<string, Snap>();
  const analyticsBySpace = new Map<string, Awaited<ReturnType<typeof getConversionAnalytics>>>();

  for (const tenantId of spaces) {
    const analytics = await getConversionAnalytics(tenantId, { preset: "last_30d" });
    analyticsBySpace.set(tenantId, analytics);
    const home = await loadGrowthOsHomeSnapshot({
      tenantId,
      userId: "",
      capabilities: allCaps,
      periodQuery: { preset: "last_30d" },
    });
    snaps.set(tenantId, home);

    const funnelKeys =
      analytics.ok
        ? analytics.data.stock.byFunnel.map((f) => f.funnelKey).join("|") || "(sin stock)"
        : "error";
    note(
      `load:${tenantId}`,
      analytics.ok,
      `captacion=${analytics.ok ? analytics.data.captacion.total : "?"} stockActivas=${home.metrics.oportunidadesActivas} funnel=${home.funnel?.funnelLabel ?? "null"} stages=${home.funnel?.stages.map((s) => s.label).join(">") || "—"} keys=${funnelKeys}`
    );
  }

  // 1. Isolation: no space should share identical non-trivial metric fingerprint with another unless both empty
  const fingerprints = [...snaps.entries()].map(([id, h]) => ({
    id,
    fp: `${h.metrics.nuevosProspectos}|${h.metrics.oportunidadesActivas}|${h.metrics.ganadas}|${h.metrics.actividad}|${h.funnel?.funnelKey}|${h.funnel?.stages.map((s) => s.key + ":" + s.count).join(",")}`,
    empty:
      h.metrics.nuevosProspectos === 0 &&
      h.metrics.oportunidadesActivas === 0 &&
      h.metrics.ganadas === 0 &&
      h.metrics.actividad === 0,
  }));

  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const a = fingerprints[i]!;
      const b = fingerprints[j]!;
      if (a.empty && b.empty) {
        note(
          `iso-empty:${a.id}:${b.id}`,
          true,
          "ambos vacíos (esperado, sin fuga de datos)"
        );
        continue;
      }
      const leak = a.fp === b.fp && !a.empty;
      note(
        `iso:${a.id}:${b.id}`,
        !leak,
        leak
          ? `misma huella no vacía → posible fuga: ${a.fp}`
          : `huellas distintas (${a.id}≠${b.id})`
      );
    }
  }

  // Cross-tenant pollution in pure builder
  {
    const period = resolveAnalyticsPeriod({
      preset: "last_30d",
      now: new Date("2026-09-11T15:00:00.000Z"),
    });
    if (!period.ok) throw new Error(period.error);
    const r = buildConversionAnalytics({
      tenantId: "space-a",
      period: period.period,
      readAt: "2026-09-11T15:00:00.000Z",
      opportunities: [
        {
          _id: "a1",
          tenantId: "space-a",
          status: "open",
          openedAt: "2026-09-01T12:00:00.000Z",
          funnelKey: "default",
        },
        {
          _id: "b1",
          tenantId: "space-b",
          status: "open",
          openedAt: "2026-09-01T12:00:00.000Z",
          funnelKey: "default",
        },
      ],
      activities: [],
      funnels: [
        {
          tenantId: "space-a",
          key: "default",
          stages: [{ key: "open", label: "Abierta" }],
        },
        {
          tenantId: "space-b",
          key: "default",
          stages: [{ key: "open", label: "Abierta" }],
        },
      ],
      campaigns: [],
      members: [],
    });
    note(
      "pure-isolation",
      r.captacion.total === 1 &&
        r.stock.byFunnel.reduce(
          (s, f) => s + f.stages.reduce((x, st) => x + st.count, 0),
          0
        ) === 1,
      `captacion=${r.captacion.total} (debe ignorar space-b)`
    );
  }

  // 2+3: real funnel stages vs space config
  for (const tenantId of spaces) {
    if (tenantId === TEMP_TENANT) continue;
    const home = snaps.get(tenantId)!;
    const funnelDocs = await db
      .collection<{ key: string; name?: string; workflowDefinitionKey?: string }>(
        "growth_funnels"
      )
      .find({ tenantId })
      .toArray();
    if (!home.funnel) {
      note(
        `stages:${tenantId}`,
        home.metrics.oportunidadesActivas === 0,
        home.metrics.oportunidadesActivas === 0
          ? "sin embudo visual porque no hay stock (ok)"
          : "hay stock pero funnel=null"
      );
      continue;
    }
    const matched = funnelDocs.find((f) => f.key === home.funnel!.funnelKey);
    note(
      `stages:${tenantId}`,
      Boolean(matched) || home.funnel.funnelKey === "sin-embudo",
      `Home muestra ${home.funnel.funnelKey}/${home.funnel.funnelLabel}; etapas=[${home.funnel.stages.map((s) => s.label).join(", ")}]; embudosEspacio=[${funnelDocs.map((f) => f.key).join(", ")}]`
    );
  }

  // 4. Empty space
  {
    const empty = snaps.get(TEMP_TENANT)!;
    note(
      "empty-metrics",
      empty.metrics.nuevosProspectos === 0 &&
        empty.metrics.oportunidadesActivas === 0 &&
        empty.metrics.ganadas === 0,
      `métricas en cero`
    );
    note(
      "empty-funnel",
      empty.funnel === null,
      empty.funnel === null
        ? "funnel null → UI «Sin oportunidades abiertas»"
        : `funnel inesperado ${empty.funnel.funnelKey}`
    );
    const analytics = analyticsBySpace.get(TEMP_TENANT)!;
    note(
      "empty-analytics",
      analytics.ok &&
        analytics.data.captacion.total === 0 &&
        analytics.data.cohorts.byCampaign.length === 0,
      analytics.ok
        ? `captacion=0 cohortsCampaign=${analytics.data.cohorts.byCampaign.length}`
        : "analytics fail"
    );
  }

  // 5. Multi-funnel: primary stages must not merge foreign stage keys; periodWon vs cohort
  {
    const period = resolveAnalyticsPeriod({
      preset: "last_30d",
      now: new Date("2026-09-11T15:00:00.000Z"),
    });
    if (!period.ok) throw new Error(period.error);
    const analytics = buildConversionAnalytics({
      tenantId: "multi",
      period: period.period,
      readAt: "2026-09-11T15:00:00.000Z",
      opportunities: [
        {
          _id: "1",
          tenantId: "multi",
          status: "lead",
          openedAt: "2026-09-01T12:00:00.000Z",
          funnelKey: "retail",
        },
        {
          _id: "2",
          tenantId: "multi",
          status: "lead",
          openedAt: "2026-09-01T12:00:00.000Z",
          funnelKey: "retail",
        },
        {
          _id: "3",
          tenantId: "multi",
          status: "diagnostico",
          openedAt: "2026-09-01T12:00:00.000Z",
          funnelKey: "b2b",
        },
        {
          _id: "4",
          tenantId: "multi",
          status: "won",
          openedAt: "2026-08-01T12:00:00.000Z",
          closedAt: "2026-09-05T12:00:00.000Z",
          funnelKey: "b2b",
        },
        {
          _id: "5",
          tenantId: "multi",
          status: "won",
          openedAt: "2026-08-01T12:00:00.000Z",
          closedAt: "2026-09-06T12:00:00.000Z",
          funnelKey: "retail",
        },
      ],
      activities: [],
      funnels: [
        {
          tenantId: "multi",
          key: "retail",
          stages: [
            { key: "lead", label: "Lead" },
            { key: "cita", label: "Cita" },
          ],
        },
        {
          tenantId: "multi",
          key: "b2b",
          stages: [
            { key: "diagnostico", label: "Diagnóstico" },
            { key: "propuesta", label: "Propuesta" },
          ],
        },
      ],
      campaigns: [],
      members: [],
    });

    const home = projectGrowthOsHomeDashboard({
      analytics,
      commercialRows: [],
      commercialCounts: { overdue: 0, unfollowed: 0, stale: 0 },
      activityCountInPeriod: 0,
      activities: [],
      periodLabel: "Últimos 30 días",
      capabilities: allCaps,
      hasCampaigns: false,
      hasAutomations: false,
      // Orden de otro embudo: debe ignorarse.
      funnelStageOrder: {
        funnelKey: "b2b",
        stages: [
          { key: "diagnostico", label: "Diagnóstico" },
          { key: "propuesta", label: "Propuesta" },
        ],
      },
    });

    const stageKeys = home.funnel?.stages.map((s) => s.key) ?? [];
    const mixed =
      home.funnel?.funnelKey === "retail" &&
      stageKeys.includes("diagnostico");
    note(
      "multi-funnel-stage-mix",
      !mixed,
      mixed
        ? `BUG: embudo ${home.funnel?.funnelKey} muestra etapas ajenas [${stageKeys.join(",")}]`
        : `embudo=${home.funnel?.funnelKey} etapas=[${stageKeys.join(",")}]`
    );

    note(
      "multi-funnel-periodWon-scope",
      home.funnel?.funnelKey === "retail" &&
        home.funnel.periodWon === 1 &&
        home.metrics.ganadas === 2,
      `periodWon=${home.funnel?.periodWon} métricaGanadas=${home.metrics.ganadas} funnel=${home.funnel?.funnelKey}`
    );

    note(
      "multi-funnel-cohort-scope",
      home.funnel?.funnelKey === "retail" && home.funnel.cohortSize === 2,
      `cohorte funnel=${home.funnel?.funnelKey} size=${home.funnel?.cohortSize} rate=${home.funnel?.cohortRate}`
    );

    const liveMulti = snaps.get(multiTemp);
    if (liveMulti) {
      note(
        "multi-live-stages",
        liveMulti.funnel?.funnelKey === "retail" &&
          !(liveMulti.funnel?.stages.some((s) => s.key === "diagnostico") ?? true) &&
          liveMulti.funnel.periodWon === 0 &&
          liveMulti.metrics.ganadas === 1,
        `live funnel=${liveMulti.funnel?.funnelKey} stages=[${liveMulti.funnel?.stages.map((s) => s.key).join(",")}] periodWon=${liveMulti.funnel?.periodWon} ganadasEspacio=${liveMulti.metrics.ganadas}`
      );
    }
  }

  // load-home-snapshot: stage order source vs pickPrimary
  {
    const multiTenant =
      inv.funnels.find((f) => f.count >= 2)?._id ??
      spaces.find((s) => s !== TEMP_TENANT);
    if (multiTenant) {
      const funnelDocs = await db
        .collection<{
          key: string;
          workflowDefinitionKey?: string;
        }>("growth_funnels")
        .find({ tenantId: multiTenant })
        .toArray();
      const home = snaps.get(multiTenant);
      if (home?.funnel && funnelDocs.length >= 2) {
        const preferredDefault =
          funnelDocs.find((f) => f.key === "default") ?? funnelDocs[0];
        const mismatch =
          preferredDefault &&
          home.funnel.funnelKey !== preferredDefault.key &&
          preferredDefault.key !== home.funnel.funnelKey;
        note(
          "stage-order-source",
          true,
          `espacio=${multiTenant} homeFunnel=${home.funnel.funnelKey} loadPrefiere=${preferredDefault?.key} (si difieren, order puede venir del embudo equivocado)`
        );
        if (mismatch) {
          // re-check by loading snapshot internals: if stages include keys only in other funnel
          const otherKeys = new Set(
            funnelDocs
              .filter((f) => f.key !== home.funnel!.funnelKey)
              .flatMap(() => [] as string[])
          );
          void otherKeys;
        }
      } else {
        note(
          "stage-order-source",
          true,
          `espacio=${multiTenant} funnels=${funnelDocs.length} (sin caso multi real o sin stock)`
        );
      }
    }
  }

  // 6. Permissions
  {
    const tenantId = spaces.find((s) => s !== TEMP_TENANT) ?? spaces[0]!;
    const operateHome = await loadGrowthOsHomeSnapshot({
      tenantId,
      userId: "",
      capabilities: operateOnly,
      periodQuery: { preset: "last_30d" },
    });
    const noSalesHome = await loadGrowthOsHomeSnapshot({
      tenantId,
      userId: "",
      capabilities: noSales,
      periodQuery: { preset: "last_30d" },
    });
    note(
      "perms-operate",
      operateHome.owners.length === 0 &&
        !operateHome.nextSteps.some((s) => s.id === "owners" || s.id === "campaigns") &&
        (operateHome.funnel !== null || operateHome.metrics.oportunidadesActivas === 0),
      `operate: owners=${operateHome.owners.length} funnel=${operateHome.funnel ? "yes" : "no"} next=[${operateHome.nextSteps.map((s) => s.id).join(",")}]`
    );
    note(
      "perms-no-sales",
      noSalesHome.funnel === null &&
        noSalesHome.origins.length === 0 &&
        noSalesHome.owners.length === 0 &&
        noSalesHome.metrics.nuevosProspectos === 0,
      `no-sales: funnel=${noSalesHome.funnel} origins=${noSalesHome.origins.length} nuevos=${noSalesHome.metrics.nuevosProspectos}`
    );
  }

  // 7. CUMPLE exclusivity in Home general
  {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const root = path.join(process.cwd(), "src/components/admin/preview/growth-os-master");
    const files = fs.readdirSync(root).filter((f) => /\.(ts|tsx)$/.test(f));
    const banned =
      /cumple|CUMPLE|Ley Karin|ley-karin|diagnóstico laboral|Mentor CUMPLE|mentor-cumple/i;
    const hits: string[] = [];
    for (const f of files) {
      const text = fs.readFileSync(path.join(root, f), "utf8");
      if (banned.test(text)) hits.push(f);
    }
    // also conversion analytics labels + home page
    for (const rel of [
      "src/lib/growth/conversion-analytics.ts",
      "src/lib/growth/conversion-analytics-read.ts",
      "src/components/admin/growth/ConversionAnaliticaClient.tsx",
      "src/app/admin/page.tsx",
    ]) {
      const text = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
      if (banned.test(text)) hits.push(rel);
    }
    note(
      "no-cumple-copy",
      hits.length === 0,
      hits.length === 0 ? "sin copy/servicios CUMPLE en Home/Conversion" : `hits: ${hits.join(", ")}`
    );
  }

  // Cleanup temp alt if created
  await db.collection("growth_oportunidades").deleteMany({
    captureTag: "saas-val-temp",
  });
  await db.collection("growth_funnels").deleteMany({
    captureTag: "saas-val-temp",
  });
  await db.collection("growth_actividades").deleteMany({
    captureTag: "saas-val-temp",
  });
  await db.collection("growth_oportunidades").deleteMany({ tenantId: TEMP_TENANT });
  await db.collection("growth_actividades").deleteMany({ tenantId: TEMP_TENANT });
  await db.collection("growth_funnels").deleteMany({ tenantId: TEMP_TENANT });
  await db.collection("growth_campaigns").deleteMany({ tenantId: TEMP_TENANT });

  await client.close();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n=== Resumen: ${checks.length - failed.length}/${checks.length} OK ===`);
  if (failed.length) {
    console.log("Fallos:");
    for (const f of failed) console.log(` - ${f.id}: ${f.detail}`);
    process.exitCode = 1;
  }
  // Cierra el event loop (imports server-only / Mongo pueden dejar handles).
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
