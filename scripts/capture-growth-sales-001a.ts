/**
 * OT-GROWTH-SALES-001A — capturas operatividad humana Ventas.
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-sales-001a.ts
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
const outDir = resolve("docs/validation/OT-GROWTH-SALES-001A");
mkdirSync(outDir, { recursive: true });

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
  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

  await ensureSalesPermissions(
    db,
    tenantId,
    Array.isArray(membership.roleIds) ? membership.roleIds.map(String) : []
  );

  let oportunidad = await db.collection("growth_oportunidades").findOne({
    tenantId,
    status: "active",
  });
  if (!oportunidad) {
    oportunidad = await db.collection("growth_oportunidades").findOne({
      tenantId,
    });
  }

  if (!oportunidad) {
    const now = new Date().toISOString();
    const personaId = `persona-capture-sales-001a-${Date.now()}`;
    const oportunidadId = `oportunidad-capture-sales-001a-${Date.now()}`;
    await db.collection("growth_personas").insertOne({
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
        sourceId: "capture-sales-001a",
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("growth_oportunidades").insertOne({
      _id: oportunidadId,
      tenantId,
      personaId,
      typeKey: "conversion",
      subjectType: "program",
      subjectLabel: "Programa de ejemplo",
      origin: {
        kind: "admission",
        channel: "portal-admision",
        sourceCollection: "portal_interesados",
        sourceId: "capture-sales-001a",
        capturedAt: now,
      },
      status: "active",
      workflowInstanceId: `wf-capture-sales-001a-${Date.now()}`,
      nextAction: {
        summary: "Llamar para confirmar interés",
        kind: "contact",
        setAt: now,
      },
      source: {
        sourceCollection: "portal_interesados",
        sourceId: "capture-sales-001a",
      },
      openedAt: now,
      updatedAt: now,
    });
    await db.collection("growth_actividades").insertOne({
      _id: `act-capture-sales-001a-${Date.now()}`,
      tenantId,
      personaId,
      oportunidadId,
      kind: "opportunity_opened",
      summary: "Oportunidad de conversión abierta",
      occurredAt: now,
    });
    oportunidad = await db
      .collection("growth_oportunidades")
      .findOne({ _id: oportunidadId });
    console.log(`seeded capture oportunidad ${oportunidadId}`);
  } else {
    // Asegura nextAction visible para la captura.
    if (!oportunidad.nextAction) {
      await db.collection("growth_oportunidades").updateOne(
        { _id: oportunidad._id },
        {
          $set: {
            nextAction: {
              summary: "Llamar para confirmar interés",
              kind: "contact",
              setAt: new Date().toISOString(),
            },
          },
        }
      );
      oportunidad = await db
        .collection("growth_oportunidades")
        .findOne({ _id: oportunidad._id });
    }
  }

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
  const sessionId = `sess-growth-sales-001a-${Date.now()}`;

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

  // 1. Ventas (listado)
  await page.goto(`${baseUrl}/admin/ventas`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-ventas-list.png"),
    fullPage: true,
  });
  console.log("saved admin-ventas-list.png");

  const opId = String(oportunidad?._id ?? "");
  if (!opId) {
    console.error("Sin oportunidad para capturas de detalle");
    await browser.close();
    await client.close();
    process.exit(1);
  }

  // 2. Oportunidad completa
  await page.goto(`${baseUrl}/admin/ventas/${encodeURIComponent(opId)}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-ventas-operate.png"),
    fullPage: true,
  });
  console.log("saved admin-ventas-operate.png");

  // 3. Interacción cambiar estado
  const changeStatus = page.getByRole("button", { name: "Cambiar estado" });
  if (await changeStatus.count()) {
    await changeStatus.click();
    await page.waitForTimeout(400);
  }
  await hideDevOverlay();
  await page.screenshot({
    path: resolve(outDir, "admin-ventas-change-status.png"),
    fullPage: true,
  });
  console.log("saved admin-ventas-change-status.png");

  // 4. Seguimiento (textarea con texto humano; cerrar picker de estado)
  if (await changeStatus.count()) {
    await changeStatus.click();
    await page.waitForTimeout(200);
  }
  const follow = page.getByLabel("Detalle del seguimiento");
  if (await follow.count()) {
    await follow.fill(
      "Conversé con María. Quiere matricularse la próxima semana."
    );
    await page.waitForTimeout(300);
  }
  await hideDevOverlay();
  await page.screenshot({
    path: resolve(outDir, "admin-ventas-follow-up.png"),
    fullPage: true,
  });
  console.log("saved admin-ventas-follow-up.png");

  await browser.close();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
