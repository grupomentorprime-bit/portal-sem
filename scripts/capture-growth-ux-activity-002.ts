/**
 * OT-GROWTH-UX-ACTIVITY-002 — capturas /admin/actividad (diseño final).
 * Solo datos reales del Espacio; sin actividad simulada.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-activity-002.ts
 */
import { mkdirSync, writeFileSync } from "fs";
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
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve(
  "docs/AI/auditorias/OT-GROWTH-UX-ACTIVITY-002-evidence"
);
mkdirSync(outDir, { recursive: true });

const CATEGORIES = [
  "all",
  "personas",
  "ventas",
  "mensajes",
  "automatizaciones",
] as const;

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
  const sessionId = `sess-ux-activity-002-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId,
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(`capture tenant=${tenantId} baseUrl=${baseUrl}`);

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

  const gotoActividad = async (category?: string) => {
    const href =
      !category || category === "all"
        ? `${baseUrl}/admin/actividad`
        : `${baseUrl}/admin/actividad?category=${category}`;
    await page.goto(href, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector("[data-actividad-feed]", { timeout: 60000 });
    await page.waitForTimeout(2200);
    await hideDevOverlay();
    await page.waitForTimeout(300);
  };

  const countStories = async () =>
    page.locator("[data-actividad-feed] ol li").count();

  // 1. Desktop — Todos
  await gotoActividad("all");
  await page.screenshot({
    path: resolve(outDir, "01-desktop-todos.png"),
    fullPage: true,
  });
  console.log("saved 01-desktop-todos.png");

  // 2. Desktop — otro filtro con datos (prioriza mensajes → ventas → personas → auto)
  let filterWithData: string | null = null;
  for (const cat of ["mensajes", "ventas", "personas", "automatizaciones"] as const) {
    await gotoActividad(cat);
    const n = await countStories();
    if (n > 0) {
      filterWithData = cat;
      await page.screenshot({
        path: resolve(outDir, "02-desktop-filtro-con-datos.png"),
        fullPage: true,
      });
      console.log(`saved 02-desktop-filtro-con-datos.png (${cat}, n=${n})`);
      break;
    }
  }
  if (!filterWithData) {
    console.warn(
      "Ningún filtro parcial tenía datos; se omite captura 02 (sin inventar actividad)."
    );
  }

  // 3. Mobile — Todos
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoActividad("all");
  await page.screenshot({
    path: resolve(outDir, "03-mobile-todos.png"),
    fullPage: true,
  });
  console.log("saved 03-mobile-todos.png");

  // 4. Estado vacío real: filtro sin resultados, o vacío total si el tenant no tiene items
  let emptyKind: "filtro" | "general" | "none" = "none";
  await page.setViewportSize({ width: 1440, height: 1100 });
  await gotoActividad("all");
  const allCount = await countStories();
  if (allCount === 0) {
    emptyKind = "general";
    await page.screenshot({
      path: resolve(outDir, "04-estado-vacio.png"),
      fullPage: true,
    });
    console.log("saved 04-estado-vacio.png (general)");
  } else {
    for (const cat of ["automatizaciones", "mensajes", "personas", "ventas"] as const) {
      await gotoActividad(cat);
      const n = await countStories();
      if (n === 0) {
        emptyKind = "filtro";
        await page.screenshot({
          path: resolve(outDir, "04-estado-vacio.png"),
          fullPage: true,
        });
        console.log(`saved 04-estado-vacio.png (filtro=${cat})`);
        break;
      }
    }
    if (emptyKind === "none") {
      console.warn(
        "No hubo filtro vacío ni historial vacío; se omite 04 (sin datos falsos)."
      );
    }
  }

  const meta = {
    tenantId,
    filterWithData,
    emptyKind,
    categoriesTried: CATEGORIES,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(resolve(outDir, "RESULT.json"), JSON.stringify(meta, null, 2));

  await browser.close();
  await client.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
