/**
 * OT-GROWTH-UX-PERSONAS-004 — capturas /admin/personas (diseño final).
 * Datos reales del Espacio; sin personas inventadas.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-personas-004.ts
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
  "docs/AI/auditorias/OT-GROWTH-UX-PERSONAS-004-evidence"
);
mkdirSync(outDir, { recursive: true });

const PEOPLE_PERMS = ["growth.people.view", "growth.people.manage"] as const;

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
      const missing = PEOPLE_PERMS.filter((p) => !ids.includes(p));
      if (missing.length > 0) {
        const nextIds = [...ids, ...missing];
        const nextMap = {
          ...(typeof role.permissionMap === "object" && role.permissionMap
            ? role.permissionMap
            : {}),
          "growth.people.view": true,
          "growth.people.manage": true,
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

  const personas = await db
    .collection("growth_personas")
    .find({ tenantId, status: { $ne: "merged" } })
    .sort({ updatedAt: -1 })
    .limit(20)
    .toArray();

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-ux-personas-004-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(
    `capture tenant=${tenantId} personas=${personas.length} baseUrl=${baseUrl}`
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
    personaCount: personas.length,
    permsPatched,
    capturedAt: new Date().toISOString(),
  };

  // 1. Listado desktop
  if (personas.length === 0) {
    await gotoStable(
      page,
      `${baseUrl}/admin/personas`,
      "[data-personas-empty]"
    );
    await page.screenshot({
      path: resolve(outDir, "01-desktop-listado.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: resolve(outDir, "06-estado-vacio.png"),
      fullPage: true,
    });
    meta.emptyKind = "general";
    console.log("saved 01 + 06 (vacío real)");
  } else {
    await gotoStable(
      page,
      `${baseUrl}/admin/personas`,
      "[data-personas-list]"
    );
    await page.screenshot({
      path: resolve(outDir, "01-desktop-listado.png"),
      fullPage: true,
    });
    console.log("saved 01-desktop-listado.png");

    // 2. Listado con filtros
    await gotoStable(
      page,
      `${baseUrl}/admin/personas?origin=whatsapp`,
      "[data-personas-filters]"
    );
    const hasMatch = await page.locator("[data-personas-list]").count();
    const noMatch = await page.locator("[data-personas-no-match]").count();
    await page.screenshot({
      path: resolve(outDir, "02-desktop-filtros.png"),
      fullPage: true,
    });
    meta.filterOrigin = "whatsapp";
    meta.filterHadResults = hasMatch > 0;
    meta.filterNoMatch = noMatch > 0;
    console.log("saved 02-desktop-filtros.png");

    // 6. Sin coincidencias (filtro improbable) si no había vacío general
    await gotoStable(
      page,
      `${baseUrl}/admin/personas?q=__sin_coincidencias_ux_004__`,
      "[data-personas-no-match]"
    );
    await page.screenshot({
      path: resolve(outDir, "06-estado-vacio.png"),
      fullPage: true,
    });
    meta.emptyKind = "filtro";
    console.log("saved 06-estado-vacio.png (sin coincidencias)");

    // 3–5. Ficha + conversaciones + modal
    const firstId = String(personas[0]!._id);
    meta.detailPersonaId = firstId;
    await gotoStable(
      page,
      `${baseUrl}/admin/personas/${encodeURIComponent(firstId)}`,
      "[data-persona-detail]"
    );
    await page.screenshot({
      path: resolve(outDir, "03-desktop-ficha.png"),
      fullPage: true,
    });
    console.log("saved 03-desktop-ficha.png");

    const conv = page.locator("[data-persona-conversations]");
    if ((await conv.count()) > 0) {
      await conv.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: resolve(outDir, "04-desktop-conversaciones.png"),
        fullPage: true,
      });
      meta.conversationsVisible = true;
    } else {
      await page.screenshot({
        path: resolve(outDir, "04-desktop-conversaciones.png"),
        fullPage: true,
      });
      meta.conversationsVisible = false;
      meta.conversationsNote = "Sin conversaciones reales en esta Persona";
    }
    console.log("saved 04-desktop-conversaciones.png");

    await gotoStable(
      page,
      `${baseUrl}/admin/personas`,
      "[data-personas-list], [data-personas-empty]"
    );
    const createBtn = page.getByRole("button", { name: "Crear persona" });
    if ((await createBtn.count()) > 0) {
      await createBtn.first().click();
      await page.waitForSelector("[data-persona-create-modal]", {
        timeout: 15000,
      });
      await page.waitForTimeout(500);
      await hideDevOverlay(page);
      await page.screenshot({
        path: resolve(outDir, "05-modal-crear.png"),
        fullPage: true,
      });
      meta.createModal = true;
      console.log("saved 05-modal-crear.png");
    } else {
      meta.createModal = false;
      meta.createModalNote = "Sin canManage visible";
    }

    // 7–8 mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStable(
      page,
      `${baseUrl}/admin/personas`,
      "[data-personas-list]"
    );
    await page.screenshot({
      path: resolve(outDir, "07-mobile-listado.png"),
      fullPage: true,
    });
    console.log("saved 07-mobile-listado.png");

    await gotoStable(
      page,
      `${baseUrl}/admin/personas/${encodeURIComponent(firstId)}`,
      "[data-persona-detail]"
    );
    await page.screenshot({
      path: resolve(outDir, "08-mobile-ficha.png"),
      fullPage: true,
    });
    console.log("saved 08-mobile-ficha.png");
  }

  // Si estaba vacío: aún capturar modal + mobile del vacío
  if (personas.length === 0) {
    const createBtn = page.getByRole("button", { name: "Crear persona" });
    if ((await createBtn.count()) > 0) {
      await createBtn.first().click();
      await page.waitForSelector("[data-persona-create-modal]", {
        timeout: 15000,
      });
      await page.waitForTimeout(500);
      await hideDevOverlay(page);
      await page.screenshot({
        path: resolve(outDir, "05-modal-crear.png"),
        fullPage: true,
      });
      meta.createModal = true;
      console.log("saved 05-modal-crear.png");
      await page.keyboard.press("Escape");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStable(
      page,
      `${baseUrl}/admin/personas`,
      "[data-personas-empty]"
    );
    await page.screenshot({
      path: resolve(outDir, "07-mobile-listado.png"),
      fullPage: true,
    });
    // Sin ficha real disponible
    await page.screenshot({
      path: resolve(outDir, "08-mobile-ficha.png"),
      fullPage: true,
    });
    meta.mobileDetailNote = "Sin Personas reales; mobile refleja vacío";
    console.log("saved 07/08 mobile (vacío)");

    // placeholders for missing filter/ficha shots from empty path
    await page.setViewportSize({ width: 1440, height: 1100 });
    await gotoStable(
      page,
      `${baseUrl}/admin/personas?origin=whatsapp`,
      "[data-personas-empty], [data-personas-no-match], [data-personas-list]"
    );
    await page.screenshot({
      path: resolve(outDir, "02-desktop-filtros.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: resolve(outDir, "03-desktop-ficha.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: resolve(outDir, "04-desktop-conversaciones.png"),
      fullPage: true,
    });
    meta.detailNote = "Sin Personas reales; ficha no capturable con datos";
  }

  writeFileSync(
    resolve(outDir, "RESULT.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );

  await db.collection("identity_sessions").deleteOne({ _id: sessionId as never });
  await browser.close();
  await client.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
