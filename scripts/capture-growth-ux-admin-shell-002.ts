/**
 * Capturas OT-GROWTH-UX-ADMIN-SHELL-002 — /admin productivo (no maqueta).
 * Inicio datos · Inicio vacío · Personas · Ventas · Sidebar · Responsive.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-admin-shell-002.ts
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
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-UX-ADMIN-SHELL-002");
mkdirSync(outDir, { recursive: true });

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
  const sessionId = `sess-ux-admin-shell-002-${Date.now()}`;
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

  const shot = async (name: string, url: string, opts?: { fullPage?: boolean }) => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    await hideDevOverlay();
    await page.waitForTimeout(400);
    const path = resolve(outDir, name);
    await page.screenshot({ path, fullPage: opts?.fullPage ?? true });
    console.log(`saved ${name}`);
  };

  // Desktop — /admin productivo
  await shot("admin-home-data.png", `${baseUrl}/admin`);
  await shot("admin-home-empty.png", `${baseUrl}/admin?empty=1`);
  await shot("admin-personas.png", `${baseUrl}/admin/personas`);
  await shot("admin-ventas.png", `${baseUrl}/admin/ventas`);

  // Sidebar / navegación (viewport fijo, sin fullPage para enfocar shell)
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await hideDevOverlay();
  await page.waitForTimeout(400);
  const sidebar = page.locator(".admin-shell-v2-sidebar").first();
  await sidebar.screenshot({ path: resolve(outDir, "admin-sidebar-nav.png") });
  console.log("saved admin-sidebar-nav.png");

  // Responsive (móvil)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await hideDevOverlay();
  // Abrir menú móvil para evidenciar navegación
  const openMenu = page.getByRole("button", { name: "Abrir menú" });
  if (await openMenu.isVisible()) {
    await openMenu.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({
    path: resolve(outDir, "admin-responsive.png"),
    fullPage: true,
  });
  console.log("saved admin-responsive.png");

  // Legacy intacta (compatibilidad)
  await page.setViewportSize({ width: 1440, height: 1100 });
  await shot("admin-legacy-pages.png", `${baseUrl}/admin/pages`);

  await browser.close();
  await client.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
