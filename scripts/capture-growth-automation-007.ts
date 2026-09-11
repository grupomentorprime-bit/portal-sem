/**
 * OT-GROWTH-AUTOMATION-007 — capturas historial «Qué ha pasado».
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-automation-007.ts
 *
 * Entrega: terminada · esperando · problema · móvil.
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import type { RoleCode } from "../src/core/identity/roles/codes";
import { LEGACY_ROLE_NAME_TO_CODE } from "../src/core/identity/roles/codes";
import { ensureGrowthAutomationIndexes } from "../src/core/growth/automations/indexes";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-AUTOMATION-007");
mkdirSync(outDir, { recursive: true });

const HUMAN_NAME = "Historial de seguimiento";

async function ensureAutomationsPermissions(
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

async function deleteAutomationsByFilter(
  db: ReturnType<MongoClient["db"]>,
  tenantId: string,
  filter: Record<string, unknown>
) {
  const prev = await db
    .collection("growth_automations")
    .find({ tenantId, ...filter })
    .toArray();
  const ids = prev.map((a) => String(a._id));
  if (!ids.length) return;
  await db.collection("growth_automation_versions").deleteMany({
    tenantId,
    automationId: { $in: ids },
  });
  await db.collection("growth_automation_runs").deleteMany({
    tenantId,
    automationId: { $in: ids },
  });
  await db.collection("growth_automations").deleteMany({
    tenantId,
    _id: { $in: ids },
  });
}

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  await ensureGrowthAutomationIndexes(db);

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
  const stashTenant = `__stash_auto007_${tenantId}`;
  console.log(`capture-007 tenant=${tenantId} baseUrl=${baseUrl}`);

  await ensureAutomationsPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  await deleteAutomationsByFilter(db, tenantId, { name: HUMAN_NAME });

  await db.collection("growth_automations").updateMany(
    { tenantId },
    { $set: { tenantId: stashTenant } }
  );
  await db.collection("growth_automation_versions").updateMany(
    { tenantId },
    { $set: { tenantId: stashTenant } }
  );
  await db.collection("growth_automation_runs").updateMany(
    { tenantId },
    { $set: { tenantId: stashTenant } }
  );

  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const automationId = new ObjectId().toString();
  const versionId = new ObjectId().toString();

  const steps = [
    {
      kind: "trigger",
      eventTypes: ["GrowthOpportunityOpened"],
    },
    {
      kind: "action",
      action: "salesSetNextAction",
      summary: "Llamar para confirmar interés",
    },
    { kind: "wait", durationMs: 2 * 86_400_000 },
    {
      kind: "action",
      action: "salesRecordFollowUp",
      followUpKind: "note",
      summary: "Volver a contactar",
    },
  ];

  await db.collection("growth_automations").insertOne({
    _id: automationId,
    tenantId,
    name: HUMAN_NAME,
    status: "active",
    publishedVersion: 1,
    draftVersion: null,
    createdAt: now,
    updatedAt: now,
    createdByUserId: String(user._id),
    updatedByUserId: String(user._id),
  });
  await db.collection("growth_automation_versions").insertOne({
    _id: versionId,
    automationId,
    tenantId,
    version: 1,
    status: "published",
    steps,
    createdAt: now,
    updatedAt: now,
    createdByUserId: String(user._id),
    updatedByUserId: String(user._id),
    publishedAt: now,
    publishedByUserId: String(user._id),
  });

  const continueAt = isoDaysFromNow(2);
  const continueLabel = new Date(continueAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });

  const runs = [
    {
      _id: new ObjectId().toString(),
      tenantId,
      automationId,
      attemptKey: "capture-completed",
      status: "completed",
      startedAt: isoMinutesAgo(90),
      updatedAt: isoMinutesAgo(90),
      lines: [
        { at: isoMinutesAgo(90), text: "Se creó una oportunidad." },
        {
          at: isoMinutesAgo(90),
          text: "Definió qué hacer ahora: “Llamar para confirmar interés”.",
        },
        {
          at: isoMinutesAgo(90),
          text: "Registró el seguimiento “Volver a contactar”.",
        },
        { at: isoMinutesAgo(90), text: "Terminó correctamente." },
      ],
    },
    {
      _id: new ObjectId().toString(),
      tenantId,
      automationId,
      attemptKey: "capture-waiting",
      status: "waiting",
      startedAt: isoMinutesAgo(20),
      updatedAt: isoMinutesAgo(20),
      scheduledFor: continueAt,
      waitDurationLabel: "2 días",
      lines: [
        { at: isoMinutesAgo(20), text: "Se creó una oportunidad." },
        {
          at: isoMinutesAgo(20),
          text: "Definió qué hacer ahora: “Llamar para confirmar interés”.",
        },
        { at: isoMinutesAgo(20), text: "Está esperando 2 días." },
        {
          at: isoMinutesAgo(20),
          text: `Continuará el ${continueLabel}.`,
        },
      ],
    },
    {
      _id: new ObjectId().toString(),
      tenantId,
      automationId,
      attemptKey: "capture-failed",
      status: "needs_attention",
      startedAt: isoMinutesAgo(5),
      updatedAt: isoMinutesAgo(5),
      errorDetail: "La oportunidad ya no admite ese cambio.",
      lines: [
        { at: isoMinutesAgo(5), text: "Se creó una oportunidad." },
        { at: isoMinutesAgo(5), text: "No se pudo completar esta acción." },
      ],
    },
  ];
  await db.collection("growth_automation_runs").insertMany(runs);

  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-growth-auto-007-${Date.now()}`;
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
    viewport: { width: 1440, height: 1400 },
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

  const shot = async (name: string) => {
    await hideDevOverlay();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: resolve(outDir, name),
      fullPage: true,
    });
    console.log(`saved ${name}`);
  };

  const detailUrl = `${baseUrl}/admin/automatizaciones/${encodeURIComponent(automationId)}`;

  try {
    await page.goto(detailUrl, { waitUntil: "load", timeout: 120000 });
    await page.getByText("Qué ha pasado").waitFor({ timeout: 60000 });

    // Asegurar que no hay jerga técnica visible.
    const bodyText = await page.locator("body").innerText();
    if (/resumeKey|eventId|attemptKey|automationId|payload/i.test(bodyText)) {
      throw new Error("Jerga técnica visible en la UI de historial");
    }

    await page
      .locator('[data-automation-run-status="completed"]')
      .first()
      .scrollIntoViewIfNeeded();
    await shot("admin-automatizaciones-history-completed.png");

    await page
      .locator('[data-automation-run-status="waiting"]')
      .first()
      .scrollIntoViewIfNeeded();
    await shot("admin-automatizaciones-history-waiting.png");

    const problem = page.locator('[data-automation-run-status="needs_attention"]').first();
    await problem.scrollIntoViewIfNeeded();
    const more = problem.getByRole("button", { name: "Ver un poco más" });
    if (await more.count()) {
      await more.click();
      await page.locator("[data-automation-run-detail]").waitFor({ timeout: 5000 });
    }
    await shot("admin-automatizaciones-history-attention.png");

    await context.close();
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    await mobile.addCookies([
      {
        name: "ah_session",
        value: sessionId,
        url: baseUrl,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const mobilePage = await mobile.newPage();
    await mobilePage.addInitScript(() => {
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
    await mobilePage.goto(detailUrl, { waitUntil: "load", timeout: 120000 });
    await mobilePage.getByText("Qué ha pasado").waitFor({ timeout: 60000 });
    await mobilePage.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: resolve(outDir, "admin-automatizaciones-history-responsive.png"),
      fullPage: true,
    });
    console.log("saved admin-automatizaciones-history-responsive.png");
    await mobile.close();
  } finally {
    await browser.close();
    await db.collection("identity_sessions").deleteOne({ _id: sessionId });
    await deleteAutomationsByFilter(db, tenantId, { name: HUMAN_NAME });
    await db
      .collection("growth_automations")
      .updateMany({ tenantId: stashTenant }, { $set: { tenantId } });
    await db
      .collection("growth_automation_versions")
      .updateMany({ tenantId: stashTenant }, { $set: { tenantId } });
    await db
      .collection("growth_automation_runs")
      .updateMany({ tenantId: stashTenant }, { $set: { tenantId } });
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
