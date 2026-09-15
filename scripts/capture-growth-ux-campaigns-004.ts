/**
 * OT-GROWTH-UX-CAMPAIGNS-004 — capturas /admin/campanas (diseño final).
 * Datos reales del Espacio; métricas no inventadas.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-campaigns-004.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium, type Page } from "playwright";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve(
  "docs/AI/auditorias/OT-GROWTH-UX-CAMPAIGNS-004-evidence"
);
mkdirSync(outDir, { recursive: true });

const CAMPAIGN_PERMS = [
  "growth.campaigns.view",
  "growth.campaigns.manage",
] as const;

async function hideDevOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
}

async function gotoStable(page: Page, href: string, ready: string) {
  await page.goto(href, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(ready, { timeout: 60000 });
  await page.waitForTimeout(1800);
  await hideDevOverlay(page);
  await page.waitForTimeout(250);
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const membershipPreferred = await db
    .collection("identity_memberships")
    .findOne({
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
  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) {
    console.error("Usuario de membresía no encontrado");
    process.exit(1);
  }

  const roleIds = Array.isArray(membership.roleIds)
    ? membership.roleIds.map(String)
    : [];
  const primaryRoleId = roleIds[0];
  let permsPatched = false;
  if (primaryRoleId) {
    const role = await db.collection("identity_roles").findOne({
      _id: primaryRoleId as never,
    });
    if (role) {
      const ids = Array.isArray(role.permissionIds)
        ? role.permissionIds.map(String)
        : [];
      const missing = CAMPAIGN_PERMS.filter((p) => !ids.includes(p));
      if (missing.length > 0) {
        const nextIds = [...ids, ...missing];
        const nextMap = {
          ...(typeof role.permissionMap === "object" && role.permissionMap
            ? role.permissionMap
            : {}),
          "growth.campaigns.view": true,
          "growth.campaigns.manage": true,
        };
        await db.collection("identity_roles").updateOne(
          { _id: primaryRoleId as never },
          {
            $set: {
              permissionIds: nextIds,
              permissionMap: nextMap,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        permsPatched = true;
        console.log("patched role perms", primaryRoleId, missing);
      }
    }
  }

  const existingCampaigns = await db
    .collection("growth_campaigns")
    .find({ tenantId })
    .sort({ updatedAt: -1 })
    .toArray();

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-ux-campaigns-004-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(
    `capture tenant=${tenantId} existing=${existingCampaigns.length} baseUrl=${baseUrl}`
  );

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

  const meta: Record<string, unknown> = {
    tenantId,
    existingCampaignCount: existingCampaigns.length,
    permsPatched,
    capturedAt: new Date().toISOString(),
  };

  // 6 first if empty: estado vacío real antes de crear
  if (existingCampaigns.length === 0) {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas`,
      "[data-campanas-empty]"
    );
    await page.screenshot({
      path: resolve(outDir, "06-estado-vacio.png"),
      fullPage: true,
    });
    meta.emptyKind = "general";
    console.log("saved 06-estado-vacio.png");

    // 01 desktop listado vacío (mismo estado)
    await page.screenshot({
      path: resolve(outDir, "01-desktop-listado.png"),
      fullPage: true,
    });
    console.log("saved 01-desktop-listado.png (vacío)");
  } else {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas`,
      "[data-campanas-list]"
    );
    await page.screenshot({
      path: resolve(outDir, "01-desktop-listado.png"),
      fullPage: true,
    });
    console.log("saved 01-desktop-listado.png");
    meta.emptyKind = "omitido-hay-campañas";
  }

  // 2. Desktop — crear campaña
  await gotoStable(
    page,
    `${baseUrl}/admin/campanas/nueva`,
    "[data-campana-wizard]"
  );
  await page.screenshot({
    path: resolve(outDir, "02-desktop-crear.png"),
    fullPage: true,
  });
  console.log("saved 02-desktop-crear.png");

  // Crear campaña real (config) para detalle si no hay ninguna
  let detailId: string | null =
    existingCampaigns.find((c) => c.status === "active")?._id
      ? String(existingCampaigns.find((c) => c.status === "active")!._id)
      : existingCampaigns[0]?._id
        ? String(existingCampaigns[0]._id)
        : null;
  let createdForCapture = false;

  if (!detailId) {
    const created = await page.request.post(
      `${baseUrl}/api/growth/campaigns`,
      {
        data: {
          name: "Campaña Matrículas 2027",
          objective:
            "Conseguir nuevos interesados para el programa",
          trackingKey: `ux-capture-${Date.now().toString(36)}`,
          source: { kind: "none" },
          audience: { filters: [] },
          automationId: null,
        },
      }
    );
    const body = (await created.json()) as {
      ok?: boolean;
      campaign?: { _id: string };
      error?: string;
    };
    if (!created.ok() || !body.ok || !body.campaign?._id) {
      console.warn("No se pudo crear campaña para detalle:", body.error);
      meta.createError = body.error ?? created.status();
    } else {
      detailId = body.campaign._id;
      createdForCapture = true;
      const act = await page.request.post(
        `${baseUrl}/api/growth/campaigns/${detailId}/activate`
      );
      const actBody = (await act.json()) as { ok?: boolean; error?: string };
      meta.activated = Boolean(act.ok() && actBody.ok);
      if (!meta.activated) {
        console.warn("Activate falló:", actBody.error);
      }
    }
  }

  meta.detailId = detailId;
  meta.createdForCapture = createdForCapture;

  // Si creamos, recapturar listado con datos
  if (createdForCapture) {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas`,
      "[data-campanas-list]"
    );
    await page.screenshot({
      path: resolve(outDir, "01-desktop-listado.png"),
      fullPage: true,
    });
    console.log("saved 01-desktop-listado.png (con campaña real)");
  }

  // 3. Desktop — detalle
  if (detailId) {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas/${detailId}`,
      "[data-campana-detail]"
    );
    await page.screenshot({
      path: resolve(outDir, "03-desktop-detalle.png"),
      fullPage: true,
    });
    console.log("saved 03-desktop-detalle.png");
  } else {
    console.warn("Sin detalle: se omite 03");
  }

  // 4. Mobile — listado
  await page.setViewportSize({ width: 390, height: 844 });
  const listReady = detailId
    ? "[data-campanas-list]"
    : "[data-campanas-empty], [data-campanas-list]";
  await gotoStable(page, `${baseUrl}/admin/campanas`, listReady);
  await page.screenshot({
    path: resolve(outDir, "04-mobile-listado.png"),
    fullPage: true,
  });
  console.log("saved 04-mobile-listado.png");

  // 5. Mobile — detalle o crear
  if (detailId) {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas/${detailId}`,
      "[data-campana-detail]"
    );
    await page.screenshot({
      path: resolve(outDir, "05-mobile-detalle.png"),
      fullPage: true,
    });
    console.log("saved 05-mobile-detalle.png");
    meta.mobileShot = "detalle";
  } else {
    await gotoStable(
      page,
      `${baseUrl}/admin/campanas/nueva`,
      "[data-campana-wizard]"
    );
    await page.screenshot({
      path: resolve(outDir, "05-mobile-crear.png"),
      fullPage: true,
    });
    console.log("saved 05-mobile-crear.png");
    meta.mobileShot = "crear";
  }

  writeFileSync(resolve(outDir, "RESULT.json"), JSON.stringify(meta, null, 2));

  await browser.close();
  await client.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
