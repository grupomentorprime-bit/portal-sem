/**
 * OT-GROWTH-SALES-001 — capturas /admin/ventas (cola + operar).
 * Preferencia: Espacio ADL (`adl`).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-sales-001.ts
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
const outDir = resolve("docs/validation/OT-GROWTH-SALES-001");
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
  const client = new MongoClient(uri);
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
  });

  if (!oportunidad) {
    const now = new Date().toISOString();
    const personaId = `persona-capture-sales-${Date.now()}`;
    const oportunidadId = `oportunidad-capture-sales-${Date.now()}`;
    await db.collection("growth_personas").insertOne({
      _id: personaId,
      tenantId,
      status: "active",
      displayName: "Camila Rojas",
      firstName: "Camila",
      lastName: "Rojas",
      email: "camila.rojas@example.com",
      emailNormalized: "camila.rojas@example.com",
      phone: "+56 9 1122 3344",
      phoneNormalized: "911223344",
      emails: [],
      phones: [],
      origin: {
        kind: "form",
        channel: "web",
        sourceCollection: "experience_form_submissions",
        sourceId: "capture-sales-001",
        capturedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("growth_oportunidades").insertOne({
      _id: oportunidadId,
      tenantId,
      personaId,
      typeKey: "inquiry",
      subjectType: "program",
      subjectLabel: "Consulta de programa",
      origin: {
        kind: "form",
        channel: "web",
        sourceCollection: "experience_form_submissions",
        sourceId: "capture-sales-001",
        capturedAt: now,
      },
      status: "open",
      workflowInstanceId: `wf-capture-sales-${Date.now()}`,
      nextAction: {
        summary: "Responder consulta inicial",
        kind: "contact",
        setAt: now,
      },
      source: {
        sourceCollection: "experience_form_submissions",
        sourceId: "capture-sales-001",
      },
      openedAt: now,
      updatedAt: now,
    });
    await db.collection("growth_actividades").insertOne({
      _id: `act-capture-sales-${Date.now()}`,
      tenantId,
      personaId,
      oportunidadId,
      kind: "opportunity_opened",
      summary: "Oportunidad de consulta abierta",
      occurredAt: now,
    });
    oportunidad = await db
      .collection("growth_oportunidades")
      .findOne({ _id: oportunidadId });
    console.log(`seeded capture oportunidad ${oportunidadId}`);
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
  const sessionId = `sess-growth-sales-001-${Date.now()}`;

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

  // —— Estado vacío (ocultar oportunidades del tenant temporalmente) ——
  const visible = await db
    .collection("growth_oportunidades")
    .find({ tenantId })
    .project({ _id: 1, tenantId: 1 })
    .toArray();
  const hideTag = `sales-empty-${Date.now()}`;
  if (visible.length > 0) {
    for (const doc of visible) {
      await db.collection("growth_oportunidades").updateOne(
        { _id: doc._id },
        {
          $set: {
            tenantId: `${tenantId}__capture_hidden__${hideTag}`,
            _captureSalesTag: hideTag,
            _captureSalesPrevTenant: tenantId,
          },
        }
      );
    }
  }

  await page.goto(`${baseUrl}/admin/ventas`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "admin-ventas-empty.png"),
    fullPage: true,
  });
  console.log("saved admin-ventas-empty.png");

  if (visible.length > 0) {
    for (const doc of visible) {
      await db.collection("growth_oportunidades").updateOne(
        { _id: doc._id, _captureSalesTag: hideTag },
        {
          $set: { tenantId },
          $unset: {
            _captureSalesTag: "",
            _captureSalesPrevTenant: "",
          },
        }
      );
    }
  }

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
  if (opId) {
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
  }

  await browser.close();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
