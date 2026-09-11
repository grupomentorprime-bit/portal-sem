/**
 * OT-GROWTH-MESSAGING-004 — capturas bandeja Mensajes (desktop + móvil).
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-messaging-004.ts
 *
 * Entrega: inbox desktop · hilo abierto desktop · móvil lista · móvil chat.
 * No declara APTO VISUAL.
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import type { RoleCode } from "../src/core/identity/roles/codes";
import { LEGACY_ROLE_NAME_TO_CODE } from "../src/core/identity/roles/codes";
import { ensureGrowthMessagingIndexes } from "../src/core/growth/messaging";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-MESSAGING-004");
mkdirSync(outDir, { recursive: true });

const CAPTURE_TAG = "capture-messaging-004";

async function ensureSalesPermissions(
  db: ReturnType<MongoClient["db"]>,
  tenantId: string,
  roleIds: string[]
) {
  for (const roleId of roleIds) {
    const role = await db.collection("identity_roles").findOne({
      _id: roleId,
      tenantId,
    });
    if (!role) continue;
    const code =
      (role.code as RoleCode | undefined) ??
      LEGACY_ROLE_NAME_TO_CODE[String(role.name)] ??
      null;
    if (!code) continue;
    const permissionMap = getDefaultRolePermissionTemplate(code);
    const permissionIds = granularToLegacyPermissions(permissionMap);
    await db.collection("identity_roles").updateOne(
      { _id: roleId },
      {
        $set: {
          permissionMap,
          permissionIds,
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  await ensureGrowthMessagingIndexes(db);

  const membershipPreferred = await db.collection("identity_memberships").findOne({
    tenantId: preferredTenant,
    status: "active",
  });
  const membership =
    membershipPreferred ??
    (await db.collection("identity_memberships").findOne({
      status: "active",
      tenantId: { $exists: true, $ne: "" },
    }));
  if (!membership?.userId || !membership.tenantId) {
    console.error("Sin membresía activa para captura");
    process.exit(1);
  }

  const tenantId = String(membership.tenantId);
  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  await ensureSalesPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  // Limpia semillas previas de esta captura.
  const prevPersonas = await db
    .collection("growth_personas")
    .find({ tenantId, "origin.sourceId": CAPTURE_TAG })
    .project({ _id: 1 })
    .toArray();
  const prevPersonaIds = prevPersonas.map((p) => String(p._id));
  if (prevPersonaIds.length) {
    const prevConvs = await db
      .collection("growth_conversaciones")
      .find({ tenantId, personaId: { $in: prevPersonaIds } })
      .project({ _id: 1 })
      .toArray();
    const prevConvIds = prevConvs.map((c) => String(c._id));
    if (prevConvIds.length) {
      await db.collection("growth_mensajes").deleteMany({
        tenantId,
        conversationId: { $in: prevConvIds },
      });
      await db.collection("growth_conversaciones").deleteMany({
        tenantId,
        _id: { $in: prevConvIds },
      });
    }
    await db.collection("growth_oportunidades").deleteMany({
      tenantId,
      personaId: { $in: prevPersonaIds },
    });
    await db.collection("growth_personas").deleteMany({
      tenantId,
      _id: { $in: prevPersonaIds },
    });
  }
  await db.collection("growth_mensajes").deleteMany({
    tenantId,
    externalMessageId: { $regex: `^capture-(in|out)-` },
  });
  await db.collection("growth_conversaciones").deleteMany({
    tenantId,
    externalThreadId: { $regex: `^capture-phone:` },
  });

  const now = new Date().toISOString();
  const stamp = Date.now();

  const personaA = `persona-${CAPTURE_TAG}-a-${stamp}`;
  const personaB = `persona-${CAPTURE_TAG}-b-${stamp}`;
  const oportunidadA = `oportunidad-${CAPTURE_TAG}-a-${stamp}`;
  const convA = `conv-${CAPTURE_TAG}-a-${stamp}`;
  const convB = `conv-${CAPTURE_TAG}-b-${stamp}`;

  await db.collection("growth_personas").insertMany([
    {
      _id: personaA,
      tenantId,
      status: "active",
      displayName: "María González",
      firstName: "María",
      lastName: "González",
      email: `maria.messaging004.${stamp}@example.com`,
      emailNormalized: `maria.messaging004.${stamp}@example.com`,
      phone: "+56 9 8765 4321",
      phoneNormalized: `987654321${String(stamp).slice(-4)}`,
      emails: [],
      phones: [],
      origin: {
        kind: "manual",
        channel: "whatsapp",
        sourceCollection: "capture",
        sourceId: CAPTURE_TAG,
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: personaB,
      tenantId,
      status: "active",
      displayName: "Carlos Pérez",
      firstName: "Carlos",
      lastName: "Pérez",
      email: `carlos.messaging004.${stamp}@example.com`,
      emailNormalized: `carlos.messaging004.${stamp}@example.com`,
      phone: "+56 9 1234 5678",
      phoneNormalized: `912345678${String(stamp).slice(-4)}`,
      emails: [],
      phones: [],
      origin: {
        kind: "manual",
        channel: "whatsapp",
        sourceCollection: "capture",
        sourceId: CAPTURE_TAG,
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("growth_oportunidades").insertOne({
    _id: oportunidadA,
    tenantId,
    personaId: personaA,
    typeKey: "conversion",
    subjectType: "program",
    subjectLabel: "Diplomado en Gestión",
    origin: {
      kind: "manual",
      channel: "whatsapp",
      sourceCollection: "capture",
      sourceId: CAPTURE_TAG,
      capturedAt: now,
    },
    status: "active",
    workflowInstanceId: `wf-${CAPTURE_TAG}-${stamp}`,
    nextAction: {
      summary: "Responder consulta por WhatsApp",
      kind: "contact",
      setAt: now,
    },
    source: {
      sourceCollection: "capture",
      sourceId: CAPTURE_TAG,
    },
    openedAt: now,
    updatedAt: now,
  });

  const t1 = minutesAgo(45);
  const t2 = minutesAgo(40);
  const t3 = minutesAgo(12);
  const t4 = minutesAgo(8);
  const t5 = minutesAgo(3);

  await db.collection("growth_conversaciones").insertMany([
    {
      _id: convA,
      tenantId,
      personaId: personaA,
      channel: "whatsapp",
      status: "open",
      oportunidadId: oportunidadA,
      externalThreadId: `capture-phone:56987654321`,
      createdAt: t1,
      updatedAt: t5,
      lastMessageAt: t5,
    },
    {
      _id: convB,
      tenantId,
      personaId: personaB,
      channel: "whatsapp",
      status: "open",
      externalThreadId: `capture-phone:56912345678`,
      createdAt: t3,
      updatedAt: t3,
      lastMessageAt: t3,
    },
  ]);

  await db.collection("growth_mensajes").insertMany([
    {
      _id: `msg-${CAPTURE_TAG}-a1-${stamp}`,
      tenantId,
      conversationId: convA,
      channel: "whatsapp",
      direction: "inbound",
      body: "Hola, me interesa el diplomado. ¿Cuándo empieza?",
      status: "received",
      externalMessageId: `capture-in-a1-${stamp}`,
      clientRequestId: `capture-req-a1-${stamp}`,
      occurredAt: t1,
      createdAt: t1,
    },
    {
      _id: `msg-${CAPTURE_TAG}-a2-${stamp}`,
      tenantId,
      conversationId: convA,
      channel: "whatsapp",
      direction: "outbound",
      body: "¡Hola María! Empieza el 5 de octubre. ¿Te paso el temario?",
      status: "sent",
      externalMessageId: `capture-out-a2-${stamp}`,
      clientRequestId: `capture-req-a2-${stamp}`,
      occurredAt: t2,
      createdAt: t2,
    },
    {
      _id: `msg-${CAPTURE_TAG}-a3-${stamp}`,
      tenantId,
      conversationId: convA,
      channel: "whatsapp",
      direction: "inbound",
      body: "Sí, por favor. También quiero saber si hay descuento.",
      status: "received",
      externalMessageId: `capture-in-a3-${stamp}`,
      clientRequestId: `capture-req-a3-${stamp}`,
      occurredAt: t5,
      createdAt: t5,
    },
    {
      _id: `msg-${CAPTURE_TAG}-b1-${stamp}`,
      tenantId,
      conversationId: convB,
      channel: "whatsapp",
      direction: "inbound",
      body: "Buenas, ¿tienen horarios vespertinos?",
      status: "received",
      externalMessageId: `capture-in-b1-${stamp}`,
      clientRequestId: `capture-req-b1-${stamp}`,
      occurredAt: t3,
      createdAt: t3,
    },
    {
      _id: `msg-${CAPTURE_TAG}-b2-${stamp}`,
      tenantId,
      conversationId: convB,
      channel: "whatsapp",
      direction: "outbound",
      body: "Sí, los martes y jueves de 19 a 21 h.",
      status: "sent",
      externalMessageId: `capture-out-b2-${stamp}`,
      clientRequestId: `capture-req-b2-${stamp}`,
      occurredAt: t4,
      createdAt: t4,
    },
  ]);

  console.log(`seeded conversations ${convA}, ${convB}`);

  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const sessionNow = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-${CAPTURE_TAG}-${stamp}`;

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: sessionNow,
    expiresAt: expires.toISOString(),
    lastActivity: sessionNow,
  });

  const browser = await chromium.launch({ headless: true });

  const hideOverlayScript = () => {
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
  };

  // —— Desktop ——
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
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
    await page.addInitScript(hideOverlayScript);
    const hideDevOverlay = async () => {
      await page.evaluate(() => {
        document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
      });
    };

    await page.goto(
      `${baseUrl}/admin/mensajes?c=${encodeURIComponent(convA)}`,
      { waitUntil: "networkidle", timeout: 60000 }
    );
    await hideDevOverlay();
    await page.waitForSelector("[data-mensajes-inbox]", { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: resolve(outDir, "admin-mensajes-desktop.png"),
      fullPage: true,
    });
    console.log("saved admin-mensajes-desktop.png");

    const composer = page.locator("[data-mensajes-composer]");
    if (await composer.count()) {
      await composer.fill("Claro, te envío el temario y las opciones de arancel.");
      await page.waitForTimeout(300);
    }
    await hideDevOverlay();
    await page.screenshot({
      path: resolve(outDir, "admin-mensajes-desktop-composer.png"),
      fullPage: true,
    });
    console.log("saved admin-mensajes-desktop-composer.png");

    await context.close();
  }

  // —— Mobile ——
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
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
    await page.addInitScript(hideOverlayScript);
    const hideDevOverlay = async () => {
      await page.evaluate(() => {
        document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
      });
    };

    await page.goto(`${baseUrl}/admin/mensajes`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await hideDevOverlay();
    await page.waitForSelector("[data-mensajes-list]", { timeout: 30000 });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: resolve(outDir, "admin-mensajes-mobile-list.png"),
      fullPage: true,
    });
    console.log("saved admin-mensajes-mobile-list.png");

    await page.goto(
      `${baseUrl}/admin/mensajes?c=${encodeURIComponent(convA)}`,
      { waitUntil: "networkidle", timeout: 60000 }
    );
    await hideDevOverlay();
    await page.waitForSelector("[data-mensajes-thread]", { timeout: 30000 });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: resolve(outDir, "admin-mensajes-mobile-chat.png"),
      fullPage: true,
    });
    console.log("saved admin-mensajes-mobile-chat.png");

    await context.close();
  }

  await browser.close();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
