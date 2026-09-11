/**
 * OT-GROWTH-AUTOMATION-004A — capturas refinamiento UX final.
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-automation-004a.ts
 *
 * Entrega: creación desktop · detalle activo · listado · responsive.
 * El nombre en UI es humano (sin tags); cleanup usa prefijo interno solo en DB si hiciera falta.
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";
import { getDefaultRolePermissionTemplate } from "../src/core/identity/permissions/role-templates";
import { granularToLegacyPermissions } from "../src/core/identity/permissions/resolver";
import type { RoleCode } from "../src/core/identity/roles/codes";
import { LEGACY_ROLE_NAME_TO_CODE } from "../src/core/identity/roles/codes";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-AUTOMATION-004A");
mkdirSync(outDir, { recursive: true });

const HUMAN_NAME = "Seguimiento de nuevas oportunidades";

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
  await db.collection("growth_automations").deleteMany({
    tenantId,
    _id: { $in: ids },
  });
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

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
  const stashTenant = `__stash_auto004a_${tenantId}`;
  console.log(`capture-004a tenant=${tenantId} baseUrl=${baseUrl}`);

  await ensureAutomationsPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  // Limpia capturas 004 (tag técnico) y 004A (nombre humano).
  await deleteAutomationsByFilter(db, tenantId, {
    name: { $regex: /^\[capture-004\]/ },
  });
  await deleteAutomationsByFilter(db, tenantId, { name: HUMAN_NAME });

  await db.collection("growth_automations").updateMany(
    { tenantId },
    { $set: { tenantId: stashTenant } }
  );
  await db.collection("growth_automation_versions").updateMany(
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
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-growth-auto-004a-${Date.now()}`;
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

  const shot = async (name: string) => {
    await hideDevOverlay();
    await page.waitForTimeout(600);
    await page.screenshot({
      path: resolve(outDir, name),
      fullPage: true,
    });
    console.log(`saved ${name}`);
  };

  try {
    await page.goto(`${baseUrl}/admin/automatizaciones/nueva`, {
      waitUntil: "load",
      timeout: 120000,
    });
    await page.getByRole("textbox", { name: "Nombre" }).waitFor({
      timeout: 60000,
    });
    await page.getByRole("textbox", { name: "Nombre" }).fill(HUMAN_NAME);
    await page.locator('[data-automation-flow-step="1"]').waitFor({
      timeout: 30000,
    });
    await shot("admin-automatizaciones-create.png");

    // Activar para detalle + listado
    const origin = page.getByLabel("Origen", { exact: true });
    if (await origin.count()) {
      await origin.selectOption("channel:portal-admision");
    }
    await page.getByRole("button", { name: "Revisar y activar" }).click();
    await page.getByRole("button", { name: "Activar automatización" }).waitFor({
      timeout: 15000,
    });
    await page.getByRole("button", { name: "Activar automatización" }).click();
    await page.waitForURL(
      (url) =>
        /\/admin\/automatizaciones\/[^/]+$/.test(url.pathname) &&
        !url.pathname.endsWith("/nueva"),
      { timeout: 45000 }
    );
    await page.getByText("Activa", { exact: true }).waitFor({ timeout: 15000 });
    await page.getByText(HUMAN_NAME, { exact: true }).first().waitFor({
      timeout: 10000,
    });
    // Garantiza que el tag técnico no aparece en UI.
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("[capture-004]")) {
      throw new Error("Tag técnico visible en detalle activo");
    }
    await page.waitForTimeout(600);
    await shot("admin-automatizaciones-active.png");

    // 2. Listado
    await page.goto(`${baseUrl}/admin/automatizaciones`, {
      waitUntil: "load",
      timeout: 120000,
    });
    await page.getByText(HUMAN_NAME, { exact: true }).waitFor({ timeout: 30000 });
    const listText = await page.locator("body").innerText();
    if (listText.includes("[capture-004]")) {
      throw new Error("Tag técnico visible en listado");
    }
    await shot("admin-automatizaciones-list.png");

    // 3. Responsive (creación)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/admin/automatizaciones/nueva`, {
      waitUntil: "load",
      timeout: 120000,
    });
    await page.locator('[data-automation-flow-step="1"]').waitFor({
      timeout: 30000,
    });
    await shot("admin-automatizaciones-responsive.png");
  } finally {
    await db.collection("growth_automations").updateMany(
      { tenantId: stashTenant },
      { $set: { tenantId } }
    );
    await db.collection("growth_automation_versions").updateMany(
      { tenantId: stashTenant },
      { $set: { tenantId } }
    );
    await browser.close();
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
