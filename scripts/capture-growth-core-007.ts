/**
 * OT-GROWTH-CORE-007 / 007B — capturas /admin/personas (vacío, listado, ficha, oportunidad).
 * Preferencia: Espacio ADL (`adl.localhost`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-core-007.ts
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
/** Admin toma branding del Espacio de sesión; Host ADL no es obligatorio en captura. */
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-CORE-007");
mkdirSync(outDir, { recursive: true });

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const membershipPreferred = await db.collection("identity_memberships").findOne({
    tenantId: preferredTenant,
    status: "active",
  });
  const membershipFallback = membershipPreferred
    ? null
    : await db.collection("identity_memberships").findOne({
        status: "active",
        tenantId: { $exists: true, $ne: "" },
      });
  const membership = membershipPreferred ?? membershipFallback;
  if (!membership?.userId || !membership.tenantId) {
    console.error("Sin membresía activa para captura");
    process.exit(1);
  }

  const tenantId = String(membership.tenantId);
  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  let persona = await db.collection("growth_personas").findOne({
    tenantId,
    status: { $ne: "merged" },
  });

  if (!persona) {
    const now = new Date().toISOString();
    const personaId = `persona-capture-007a-${Date.now()}`;
    const oportunidadId = `oportunidad-capture-007a-${Date.now()}`;
    persona = {
      _id: personaId,
      tenantId,
      status: "active",
      displayName: "María González",
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@example.com",
      emailNormalized: "maria.gonzalez@example.com",
      phone: "+56 9 8765 4321",
      phoneNormalized: "987654321",
      emails: [],
      phones: [],
      origin: {
        kind: "admission",
        channel: "portal-admision",
        sourceCollection: "portal_interesados",
        sourceId: "capture-007a",
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("growth_personas").insertOne(persona);
    await db.collection("growth_oportunidades").insertOne({
      _id: oportunidadId,
      tenantId,
      personaId,
      typeKey: "conversion",
      subjectType: "program",
      subjectLabel: "Programa de ejemplo",
      origin: persona.origin,
      status: "active",
      workflowInstanceId: `wf-capture-007a-${Date.now()}`,
      nextAction: {
        summary: "Llamar para confirmar interés",
        kind: "contact",
        setAt: now,
        dueAt: new Date(Date.now() + 86400000).toISOString(),
      },
      source: {
        sourceCollection: "portal_interesados",
        sourceId: "capture-007a",
      },
      openedAt: now,
      updatedAt: now,
    });
    await db.collection("growth_actividades").insertMany([
      {
        _id: `act-capture-007a-a-${Date.now()}`,
        tenantId,
        personaId,
        oportunidadId,
        kind: "application_received",
        summary: "Postulación recibida",
        ingestKey: `capture-007a:${personaId}:application_received`,
        occurredAt: now,
      },
      {
        _id: `act-capture-007a-b-${Date.now()}`,
        tenantId,
        personaId,
        oportunidadId,
        kind: "opportunity_opened",
        summary: "Oportunidad de conversión abierta",
        ingestKey: `capture-007a:${personaId}:opportunity_opened`,
        occurredAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: `act-capture-007a-c-${Date.now()}`,
        tenantId,
        personaId,
        oportunidadId,
        kind: "next_action_set",
        summary: "Próxima acción: llamar para confirmar interés",
        ingestKey: `capture-007a:${personaId}:next_action_set`,
        occurredAt: now,
      },
    ]);
    console.log(`seeded capture persona ${personaId} in ${tenantId}`);
  }

  const personaId = String(persona._id);

  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-growth-core-007a-${Date.now()}`;

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
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
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `
      nextjs-portal,
      [data-next-badge-root],
      [data-nextjs-toast],
      #__next-build-watcher {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  });

  const hideDevOverlay = async () => {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
  };

  // —— Estado vacío real (sin Personas visibles) ——
  const visible = await db
    .collection("growth_personas")
    .find({ tenantId, status: { $ne: "merged" } })
    .project({ _id: 1, status: 1 })
    .toArray();
  const hideTag = `007a-empty-${Date.now()}`;
  if (visible.length > 0) {
    for (const doc of visible) {
      await db.collection("growth_personas").updateOne(
        { _id: doc._id },
        {
          $set: {
            status: "merged",
            _capture007aPrevStatus: doc.status ?? "active",
            _capture007aTag: hideTag,
          },
        }
      );
    }
  }

  await page.goto(`${baseUrl}/admin/personas`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-personas-empty.png"),
    fullPage: true,
  });
  console.log("saved admin-personas-empty.png");

  if (visible.length > 0) {
    for (const doc of visible) {
      await db.collection("growth_personas").updateOne(
        { _id: doc._id, _capture007aTag: hideTag },
        {
          $set: { status: doc.status ?? "active" },
          $unset: { _capture007aPrevStatus: "", _capture007aTag: "" },
        }
      );
    }
  }

  // —— Listado con datos ——
  await page.goto(`${baseUrl}/admin/personas`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-personas-list.png"),
    fullPage: true,
  });
  console.log("saved admin-personas-list.png");

  // —— Ficha Persona ——
  const detailUrl = `${baseUrl}/admin/personas/${encodeURIComponent(personaId)}`;
  await page.goto(detailUrl, { waitUntil: "networkidle", timeout: 60000 });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-persona-detail.png"),
    fullPage: true,
  });
  console.log("saved admin-persona-detail.png");

  const oportunidad = await db.collection("growth_oportunidades").findOne({
    tenantId,
    personaId,
  });
  if (oportunidad?._id) {
    const opUrl = `${detailUrl}?oportunidad=${encodeURIComponent(String(oportunidad._id))}`;
    await page.goto(opUrl, { waitUntil: "networkidle", timeout: 60000 });
    await hideDevOverlay();
    await page.waitForTimeout(900);
    await page.screenshot({
      path: resolve(outDir, "admin-oportunidad-detail.png"),
      fullPage: true,
    });
    console.log("saved admin-oportunidad-detail.png");
  } else {
    console.warn("Sin Oportunidad ligada; se omite admin-oportunidad-detail.png");
  }

  await browser.close();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
