/**
 * OT-GROWTH-AUTOMATION-004 — capturas UI operativa Automatizaciones.
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-automation-004.ts
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
const outDir = resolve("docs/validation/OT-GROWTH-AUTOMATION-004");
mkdirSync(outDir, { recursive: true });

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
  const stashTenant = `__stash_auto004_${tenantId}`;
  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  await ensureAutomationsPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  // Limpiar capturas previas + stash temporal para empty state real.
  const prevCapture = await db
    .collection("growth_automations")
    .find({ tenantId, name: { $regex: /^\[capture-004\]/ } })
    .toArray();
  const prevIds = prevCapture.map((a) => String(a._id));
  if (prevIds.length) {
    await db.collection("growth_automation_versions").deleteMany({
      tenantId,
      automationId: { $in: prevIds },
    });
    await db.collection("growth_automations").deleteMany({
      tenantId,
      _id: { $in: prevIds },
    });
  }

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
  const sessionId = `sess-growth-auto-004-${Date.now()}`;
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
    // 1. Empty
    await page.goto(`${baseUrl}/admin/automatizaciones`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await shot("admin-automatizaciones-empty.png");

    // 2. Crear
    await page.goto(`${baseUrl}/admin/automatizaciones/nueva`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page
      .getByRole("textbox", { name: "Nombre" })
      .fill("[capture-004] Seguimiento de nuevas oportunidades");
    await shot("admin-automatizaciones-create.png");

    // 3. Condición
    const origin = page.getByLabel("Origen", { exact: true });
    if (await origin.count()) {
      await origin.selectOption("channel:portal-admision");
    }
    await shot("admin-automatizaciones-condition.png");

    // 4. Resumen
    await page.getByRole("button", { name: "Revisar y activar" }).click();
    await page.getByRole("button", { name: "Activar automatización" }).waitFor({
      timeout: 15000,
    });
    await shot("admin-automatizaciones-review.png");

    // 5. Activar → detalle activa (no confundir /nueva con /[id])
    await page.getByRole("button", { name: "Activar automatización" }).click();
    await page.waitForURL(
      (url) =>
        /\/admin\/automatizaciones\/[^/]+$/.test(url.pathname) &&
        !url.pathname.endsWith("/nueva"),
      { timeout: 45000 }
    );
    await page.getByText("Activa", { exact: true }).waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await shot("admin-automatizaciones-active.png");

    // 6. Listado
    await page.goto(`${baseUrl}/admin/automatizaciones`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await shot("admin-automatizaciones-list.png");

    // 7. Responsive (creación)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/admin/automatizaciones/nueva`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await shot("admin-automatizaciones-responsive.png");
  } finally {
    // Restaurar stash + dejar la de captura en el Espacio (evidencia viva).
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
