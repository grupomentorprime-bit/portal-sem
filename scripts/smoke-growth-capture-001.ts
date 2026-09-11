/**
 * OT-GROWTH-CAPTURE-SMOKE-001 — prueba operativa Captación V1 (sin cambiar producto).
 * Espacio: adl (host adl.localhost:3000).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/smoke-growth-capture-001.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { MongoClient, type Db } from "mongodb";
import { chromium } from "playwright";
import { createSemDefaultForms } from "../src/core/experience/forms/defaults";
import { humanizeOriginDisplayLabel } from "../src/lib/growth/humanize-origin-display";
import { growthOriginArrivalLabel } from "../src/lib/growth/labels";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const tenantId = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const otherTenant = process.env.SMOKE_OTHER_TENANT?.trim() || "seminario-ipn";
const baseUrl = (process.env.SMOKE_BASE_URL || process.env.CAPTURE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const hostHeader = process.env.SMOKE_HOST?.trim() || "adl.localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-CAPTURE-SMOKE-001");
mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const FORM_ID = `adl-smoke-info-request`;

type Json = Record<string, unknown>;

async function httpJson(
  path: string,
  init?: { method?: string; body?: unknown; host?: string }
): Promise<{ status: number; body: Json }> {
  const url = new URL(path, baseUrl);
  const payload = init?.body !== undefined ? JSON.stringify(init.body) : undefined;
  const headers: Record<string, string> = {
    accept: "application/json",
    host: init?.host || hostHeader,
  };
  if (payload) headers["content-type"] = "application/json";

  // Node fetch may ignore Host; use raw HTTP against localhost.
  const { request } = await import("http");
  return new Promise((resolvePromise, reject) => {
    const req = request(
      {
        hostname: url.hostname === "localhost" ? "127.0.0.1" : url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: init?.method || "GET",
        headers: {
          ...headers,
          ...(payload ? { "content-length": Buffer.byteLength(payload).toString() } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let body: Json = {};
          try {
            body = text ? (JSON.parse(text) as Json) : {};
          } catch {
            body = { raw: text.slice(0, 500) };
          }
          resolvePromise({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

async function ensureSmokeForm(db: Db) {
  const existing = await db.collection("experience_forms").findOne({
    _id: FORM_ID,
    tenant: tenantId,
  });
  if (existing) {
    await db.collection("experience_forms").updateOne(
      { _id: FORM_ID, tenant: tenantId },
      { $set: { active: true, visible: true, destination: "information_request" } }
    );
    return existing;
  }
  const template = createSemDefaultForms(tenantId).find((f) => f._id === "information-request");
  if (!template) throw new Error("Sin plantilla information-request");
  const doc = {
    ...template,
    _id: FORM_ID,
    tenant: tenantId,
    name: "Solicitud de información (smoke captación)",
    active: true,
    visible: true,
  };
  await db.collection("experience_forms").insertOne(doc);
  return doc;
}

async function wait(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function findPersona(db: Db, email: string) {
  return db.collection("growth_personas").findOne({
    tenantId,
    emailNormalized: email.toLowerCase(),
    status: { $ne: "merged" },
  });
}

async function listOpps(db: Db, personaId: string) {
  return db
    .collection("growth_oportunidades")
    .find({ tenantId, personaId })
    .sort({ createdAt: -1 })
    .toArray();
}

async function listActs(db: Db, personaId: string) {
  return db
    .collection("growth_actividades")
    .find({ tenantId, personaId })
    .sort({ occurredAt: -1 })
    .toArray();
}

async function main() {
  console.log(
    JSON.stringify({ ot: "OT-GROWTH-CAPTURE-SMOKE-001", tenantId, baseUrl, hostHeader }, null, 2)
  );

  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  await ensureSmokeForm(db);
  const autos = await db
    .collection("growth_automations")
    .find({ tenantId, status: "active" })
    .project({ _id: 1, name: 1 })
    .toArray();
  console.log(
    "active automations",
    autos.map((a) => ({ id: a._id, name: a.name }))
  );

  const email1 = `smoke.form.${stamp}@example.com`;
  const phone1 = `+56 9 ${String(stamp).slice(-8)}`;
  const name1 = `Smoke Formulario ${stamp}`;

  // ---------- CASO 1 ----------
  section("CASO 1 — FORMULARIO");
  const submit1 = await httpJson(`/api/experience/forms/${FORM_ID}/submit`, {
    method: "POST",
    body: {
      data: {
        fullName: name1,
        email: email1,
        phone: phone1,
        interest: "admission",
        message: "Smoke CAPTURE-001 caso 1: quiero información.",
      },
    },
  });
  console.log("submit1", submit1.status, submit1.body);
  await wait(1200);

  const persona1 = await findPersona(db, email1);
  const opps1 = persona1 ? await listOpps(db, String(persona1._id)) : [];
  const acts1 = persona1 ? await listActs(db, String(persona1._id)) : [];
  const source1 = await db.collection("experience_form_submissions").findOne({
    tenant: tenantId,
    formId: FORM_ID,
    "data.email": email1,
  });
  const leak1 = await db.collection("growth_personas").findOne({
    tenantId: otherTenant,
    emailNormalized: email1.toLowerCase(),
  });
  const originLabel1 = persona1?.origin
    ? humanizeOriginDisplayLabel(growthOriginArrivalLabel(persona1.origin as never))
    : null;

  const case1 = {
    okSubmit: submit1.status === 200 && submit1.body.ok === true,
    sourceSaved: Boolean(source1),
    personaCreated: Boolean(persona1),
    personaId: persona1?._id ?? null,
    originPersisted: persona1?.origin ?? null,
    originHuman: originLabel1,
    oportunidad: opps1[0]
      ? { id: opps1[0]._id, typeKey: opps1[0].typeKey, status: opps1[0].status }
      : null,
    actividades: acts1.map((a) => ({
      typeKey: a.typeKey,
      summary: a.summary ?? null,
    })),
    isolationOk: !leak1,
    inVentas: opps1.some((o) => o.status && o.status !== "merged"),
  };
  console.log(JSON.stringify(case1, null, 2));

  // ---------- CASO 2 ----------
  section("CASO 2 — REPETIDO");
  const submit2 = await httpJson(`/api/experience/forms/${FORM_ID}/submit`, {
    method: "POST",
    body: {
      data: {
        fullName: name1,
        email: email1,
        phone: phone1,
        interest: "programs",
        message: "Smoke CAPTURE-001 caso 2: reenvío misma persona.",
      },
    },
  });
  console.log("submit2", submit2.status, submit2.body);
  await wait(1200);

  const personasCount = await db.collection("growth_personas").countDocuments({
    tenantId,
    emailNormalized: email1.toLowerCase(),
    status: { $ne: "merged" },
  });
  const persona2 = await findPersona(db, email1);
  const opps2 = persona2 ? await listOpps(db, String(persona2._id)) : [];
  const acts2 = persona2 ? await listActs(db, String(persona2._id)) : [];
  const sourcesCount = await db.collection("experience_form_submissions").countDocuments({
    tenant: tenantId,
    formId: FORM_ID,
    "data.email": email1,
  });

  const case2 = {
    okSubmit: submit2.status === 200 && submit2.body.ok === true,
    singlePersona: personasCount === 1,
    samePersonaId: String(persona2?._id) === String(persona1?._id),
    oportunidadesCount: opps2.length,
    reusedOpenOpportunity:
      opps1[0] && opps2.length >= 1 && String(opps1[0]._id) === String(opps2[0]._id),
    activitiesIncreased: acts2.length > acts1.length,
    sourceSubmissions: sourcesCount,
    actividadTypeKeys: acts2.map((a) => a.typeKey),
  };
  console.log(JSON.stringify(case2, null, 2));

  // ---------- CASO 3 ----------
  section("CASO 3 — ADMISIÓN");
  const admitEmail = `smoke.admit.${stamp}@example.com`;
  const admit = await httpJson("/api/admission/apply", {
    method: "POST",
    body: {
      firstName: "Smoke",
      lastName: `Admision${stamp}`,
      email: admitEmail,
      phone: `+56 9 ${String(stamp + 11).slice(-8)}`,
      church: "Iglesia Smoke",
      city: "Santiago",
      programId: "smoke-program-capture-001",
      message: "Smoke CAPTURE-001 caso 3 admisión",
    },
  });
  console.log("admit", admit.status, admit.body);
  await wait(1200);

  const interesado = admit.body.interesadoId
    ? await db.collection("portal_interesados").findOne({ _id: String(admit.body.interesadoId) })
    : await db.collection("portal_interesados").findOne({ tenant: tenantId, email: admitEmail });
  const admitPersona = await findPersona(db, admitEmail);
  const admitOpps = admitPersona ? await listOpps(db, String(admitPersona._id)) : [];
  const admitActs = admitPersona ? await listActs(db, String(admitPersona._id)) : [];
  const admitOriginHuman = admitPersona?.origin
    ? humanizeOriginDisplayLabel(growthOriginArrivalLabel(admitPersona.origin as never))
    : null;
  const leakAdmit = await db.collection("growth_personas").findOne({
    tenantId: otherTenant,
    emailNormalized: admitEmail.toLowerCase(),
  });

  const case3 = {
    okAdmit: admit.status === 200 && admit.body.ok === true,
    interesadoKept: Boolean(interesado),
    interesadoTenant: interesado?.tenant ?? null,
    handoff: admit.body.handoff ?? interesado?.handoff ?? null,
    adapter: process.env.ADMISSION_ADAPTER || "local(default)",
    personaCreated: Boolean(admitPersona),
    originHuman: admitOriginHuman,
    conversionOpp: admitOpps.find((o) => o.typeKey === "conversion")
      ? {
          id: admitOpps.find((o) => o.typeKey === "conversion")!._id,
          typeKey: "conversion",
          status: admitOpps.find((o) => o.typeKey === "conversion")!.status,
        }
      : null,
    actividades: admitActs.map((a) => a.typeKey),
    isolationOk: !leakAdmit,
  };
  console.log(JSON.stringify(case3, null, 2));

  // ---------- CASO 4 ----------
  section("CASO 4 — AUTOMATIZACIÓN");
  const autoEmail = `smoke.auto.${stamp}@example.com`;
  const waitAutoId = String(
    autos.find((a) => String(a.name).includes("espera"))?._id || autos[0]?._id || ""
  );
  const beforeRuns = waitAutoId
    ? await db.collection("growth_automation_runs").countDocuments({
        tenantId,
        automationId: waitAutoId,
      })
    : 0;

  const submitAuto = await httpJson(`/api/experience/forms/${FORM_ID}/submit`, {
    method: "POST",
    body: {
      data: {
        fullName: `Smoke Auto ${stamp}`,
        email: autoEmail,
        phone: `+56 9 ${String(stamp + 22).slice(-8)}`,
        interest: "admission",
        message: "Smoke CAPTURE-001 caso 4: disparar automatización.",
      },
    },
  });
  console.log("submitAuto", submitAuto.status, submitAuto.body);
  await wait(2000);

  const autoPersona = await findPersona(db, autoEmail);
  const autoOpps = autoPersona ? await listOpps(db, String(autoPersona._id)) : [];
  const autoActs = autoPersona ? await listActs(db, String(autoPersona._id)) : [];
  const runs = waitAutoId
    ? await db
        .collection("growth_automation_runs")
        .find({ tenantId, automationId: waitAutoId })
        .sort({ startedAt: -1 })
        .limit(5)
        .toArray()
    : [];
  const newRuns = runs.filter((r) => {
    const started = String(r.startedAt || "");
    return started >= new Date(stamp - 60_000).toISOString();
  });
  const nextAction = autoOpps[0]?.nextAction ?? null;
  const automationActorActs = autoActs.filter(
    (a) => a.actor?.id === "growth-automation" || a.actorId === "growth-automation"
  );

  const case4 = {
    okSubmit: submitAuto.status === 200 && submitAuto.body.ok === true,
    automationId: waitAutoId || null,
    personaId: autoPersona?._id ?? null,
    oportunidadOpened: Boolean(autoOpps[0]),
    nextAction,
    runsBefore: beforeRuns,
    newRuns: newRuns.map((r) => ({
      id: r._id,
      status: r.status,
      lines: r.lines ?? null,
    })),
    automationActivities: automationActorActs.map((a) => ({
      typeKey: a.typeKey,
      summary: a.summary ?? null,
    })),
    runRecorded: newRuns.length > 0,
    salesOpsEffect: Boolean(nextAction?.summary),
  };
  console.log(JSON.stringify(case4, null, 2));

  // ---------- UI (qué vio el usuario) ----------
  section("UI ADMIN — qué vio el usuario");
  const membership = await db.collection("identity_memberships").findOne({
    tenantId,
    status: "active",
  });
  const user = membership?.userId
    ? await db.collection("identity_users").findOne({ _id: membership.userId, status: "active" })
    : null;

  let ui: Json = { skipped: true };
  if (membership && user && persona1) {
    const now = new Date().toISOString();
    const expires = new Date();
    expires.setHours(expires.getHours() + 2);
    const sessionId = `sess-capture-smoke-${stamp}`;
    await db.collection("identity_sessions").insertOne({
      _id: sessionId,
      userId: String(user._id),
      tenantId,
      createdAt: now,
      expiresAt: expires.toISOString(),
      lastActivity: now,
    });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await context.addCookies([
      {
        name: "ah_session",
        value: sessionId,
        url: baseUrl,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();

    await page.goto(`${baseUrl}/admin/personas`, { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({ path: resolve(outDir, "admin-personas-after-capture.png"), fullPage: true });
    const personasText = await page.locator("body").innerText();

    await page.goto(`${baseUrl}/admin/personas/${persona1._id}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.screenshot({
      path: resolve(outDir, "admin-persona-detail-capture.png"),
      fullPage: true,
    });
    const personaDetailText = await page.locator("body").innerText();

    await page.goto(`${baseUrl}/admin/ventas`, { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({ path: resolve(outDir, "admin-ventas-after-capture.png"), fullPage: true });
    const ventasText = await page.locator("body").innerText();

    let autoHistoryText = "";
    if (waitAutoId) {
      await page.goto(`${baseUrl}/admin/automatizaciones/${waitAutoId}`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.screenshot({
        path: resolve(outDir, "admin-automatizacion-que-ha-pasado.png"),
        fullPage: true,
      });
      autoHistoryText = await page.locator("body").innerText();
    }

    await browser.close();

    ui = {
      skipped: false,
      personasShowsName: personasText.includes(name1) || personasText.includes("Smoke Formulario"),
      personaDetailHasOrigin:
        personaDetailText.includes("Solicitud de información") ||
        personaDetailText.includes("Formulario") ||
        personaDetailText.includes(originLabel1 || "___"),
      ventasShowsPerson:
        ventasText.includes(name1) ||
        ventasText.includes("Smoke Formulario") ||
        ventasText.includes("Smoke Auto"),
      autoHistoryHasSection: autoHistoryText.includes("Qué ha pasado"),
      autoHistoryShowsExecution:
        autoHistoryText.includes("oportunidad") ||
        autoHistoryText.includes("Llamar") ||
        autoHistoryText.includes("Esperando") ||
        autoHistoryText.includes("Terminad"),
    };
    console.log(JSON.stringify(ui, null, 2));
  } else {
    console.log("UI skipped: sin membresía/usuario o sin persona caso 1");
  }

  const report = {
    ot: "OT-GROWTH-CAPTURE-SMOKE-001",
    tenantId,
    formId: FORM_ID,
    case1,
    case2,
    case3,
    case4,
    ui,
    verdictHints: {
      case1Ok:
        case1.okSubmit &&
        case1.sourceSaved &&
        case1.personaCreated &&
        Boolean(case1.oportunidad) &&
        case1.actividades.length > 0 &&
        case1.isolationOk,
      case2Ok:
        case2.okSubmit &&
        case2.singlePersona &&
        case2.reusedOpenOpportunity &&
        case2.activitiesIncreased &&
        case2.sourceSubmissions >= 2,
      case3Ok:
        case3.okAdmit &&
        case3.interesadoKept &&
        case3.personaCreated &&
        Boolean(case3.conversionOpp) &&
        case3.isolationOk,
      case4Ok:
        case4.okSubmit &&
        case4.oportunidadOpened &&
        (case4.runRecorded || case4.salesOpsEffect),
    },
  };

  writeFileSync(resolve(outDir, "RESULT.json"), JSON.stringify(report, null, 2), "utf8");
  console.log("\n=== VEREDICTO PARCIAL ===");
  console.log(JSON.stringify(report.verdictHints, null, 2));
  console.log(`Wrote ${resolve(outDir, "RESULT.json")}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
