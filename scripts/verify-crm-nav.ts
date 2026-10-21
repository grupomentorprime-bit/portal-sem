/**
 * Verificación del menú CRM · Conversión en el shell productivo.
 * Uso: npx tsx --env-file=.env scripts/verify-crm-nav.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { chromium, type Locator, type Page } from "playwright";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/crm-nav");
mkdirSync(outDir, { recursive: true });

const CRM_LINKS = [
  ["Panel comercial", "/admin/conversion"],
  ["Oportunidades", "/admin/ventas"],
  ["Personas", "/admin/personas"],
  ["Embudos", "/admin/ventas/embudos"],
  ["Mi trabajo", "/admin/ventas/mi-trabajo"],
  ["Mensajes", "/admin/mensajes"],
  ["Actividad", "/admin/actividad"],
] as const;

function fail(message: string): never {
  throw new Error(message);
}

function crmButton(scope: Page | Locator) {
  return scope.getByRole("button", { name: "CRM · Conversión" });
}

async function assertCrmOpen(scope: Page | Locator, where: string) {
  const expanded = await crmButton(scope).getAttribute("aria-expanded");
  if (expanded !== "true") fail(`${where}: CRM no está abierto (aria-expanded=${expanded})`);
  for (const [label, href] of CRM_LINKS) {
    const link = scope.locator(`a[href="${href}"]`, { hasText: label });
    if ((await link.count()) < 1) {
      const visible = await scope.locator("a").allInnerTexts();
      fail(`${where}: falta ${label}. Enlaces: ${visible.join(" | ")}`);
    }
  }
  const labels = (await scope.locator("#nav-group-conversion a").allInnerTexts())
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const expected = CRM_LINKS.map(([label]) => label);
  if (labels.join("|") !== expected.join("|")) {
    fail(`${where}: orden ${labels.join(" > ")}`);
  }
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  const tenantId = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
  const adminRole = await db.collection("identity_roles").findOne({
    tenantId,
    code: { $in: ["institution_admin", "super_admin"] },
  });
  const membership = adminRole
    ? await db.collection("identity_memberships").findOne({
        status: "active",
        tenantId,
        roleIds: adminRole._id,
      })
    : await db.collection("identity_memberships").findOne({
        status: "active",
        tenantId,
      });
  if (!membership?.userId || !membership.tenantId) fail("sin membresía");
  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) fail("sin usuario");

  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const sessionId = `sess-crm-nav-${Date.now()}`;
  const tempId = `phase2-temp-${Date.now()}`;
  const tempName = `Verificación fase 2 ${tempId.slice(-6)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId: String(membership.tenantId),
    createdAt: now,
    expiresAt: expires,
    lastActivity: now,
  });

  await db.collection("growth_personas").insertOne({
    _id: tempId,
    tenantId: String(membership.tenantId),
    status: "active",
    displayName: tempName,
    emails: [],
    phones: [],
    origin: {
      kind: "manual",
      sourceCollection: "phase2_verification",
      sourceId: tempId,
      capturedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("growth_oportunidades").insertOne({
    _id: tempId,
    tenantId: String(membership.tenantId),
    personaId: tempId,
    typeKey: "inquiry",
    subjectType: "form",
    origin: {
      kind: "manual",
      sourceCollection: "phase2_verification",
      sourceId: tempId,
      capturedAt: now,
    },
    status: "open",
    funnelKey: "default",
    organizationId: null,
    source: { sourceCollection: "phase2_verification", sourceId: tempId },
    workflowInstanceId: tempId,
    nextAction: null,
    openedAt: now,
    updatedAt: now,
    ownerUserId: String(user._id),
    lastActivityAt: now,
  });

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const skipDesktop = process.env.SKIP_DESKTOP === "1";
    if (!skipDesktop) {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await desktop.addCookies([
      { name: "ah_session", value: sessionId, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const page = await desktop.newPage();
    page.setDefaultTimeout(120000);
    page.setDefaultNavigationTimeout(120000);
    const side = page.getByRole("complementary", { name: "Barra lateral" });
    await page.addInitScript(() => localStorage.removeItem("sem-admin-nav-expanded-group"));

    await page.goto(`${baseUrl}/admin/ventas`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await crmButton(side).waitFor({ timeout: 60000 });
    if (page.url().includes("/login")) fail(`redirigió a login: ${page.url()}`);
    await page.waitForFunction(() =>
      [...(document.querySelector('aside[aria-label="Barra lateral"]')?.querySelectorAll("button") ?? [])].some(
        (node) => node.textContent?.includes("CRM · Conversión") && node.getAttribute("aria-expanded") === "true"
      )
    );
    await assertCrmOpen(side, "ventas");
    if ((await side.locator('a[href="/admin"]', { hasText: "Inicio" }).count()) < 1) {
      fail("falta Inicio independiente");
    }
    if ((await side.getByText("Crecer", { exact: true }).count()) < 1) fail("falta zona Crecer");
    for (const label of ["Campañas", "Automatizaciones", "Analítica"]) {
      if ((await side.getByRole("link", { name: label, exact: true }).count()) < 1) {
        fail(`falta ${label}`);
      }
    }
    await page.screenshot({ path: resolve(outDir, "desktop-ventas.png") });

    await side.getByRole("link", { name: "Personas", exact: true }).click();
    await page.waitForURL("**/admin/personas**", { waitUntil: "domcontentloaded", timeout: 180000 });
    await assertCrmOpen(side, "personas");
    const personasCurrent = await side.locator('a[href="/admin/personas"]').getAttribute("aria-current");
    if (personasCurrent !== "page") fail("Personas no queda activa");

    await side.getByRole("link", { name: "Embudos", exact: true }).click();
    await page.waitForURL("**/admin/ventas/embudos**", { waitUntil: "domcontentloaded", timeout: 180000 });
    await assertCrmOpen(side, "embudos");
    const ventasCurrent = await side.locator('a[href="/admin/ventas"]').getAttribute("aria-current");
    const embudosCurrent = await side.locator('a[href="/admin/ventas/embudos"]').getAttribute("aria-current");
    if (ventasCurrent === "page") fail("Oportunidades queda activa en Embudos");
    if (embudosCurrent !== "page") fail("Embudos no queda activa");

    await side.getByRole("link", { name: "Campañas", exact: true }).click();
    await page.waitForURL("**/admin/campanas**", { waitUntil: "domcontentloaded", timeout: 180000 });
    if ((await crmButton(side).getAttribute("aria-expanded")) !== "true") {
      fail("CRM se cerró al ir a Campañas");
    }
    await page.screenshot({ path: resolve(outDir, "desktop-campanas-crm-abierto.png") });

    await crmButton(side).click();
    if ((await crmButton(side).getAttribute("aria-expanded")) !== "false") {
      fail("no se pudo cerrar CRM fuera de sus secciones");
    }
    const storedClosed = await page.evaluate(() => localStorage.getItem("sem-admin-nav-expanded-group"));
    if (storedClosed) fail(`el cierre no persistió: ${storedClosed}`);

    await page.goto(`${baseUrl}/admin/mensajes`, { waitUntil: "domcontentloaded" });
    await crmButton(side).waitFor({ timeout: 20000 });
    await page.waitForFunction(() =>
      [...(document.querySelector('aside[aria-label="Barra lateral"]')?.querySelectorAll("button") ?? [])].some(
        (node) => node.textContent?.includes("CRM · Conversión") && node.getAttribute("aria-expanded") === "true"
      )
    );
    await assertCrmOpen(side, "mensajes reabre");
    await page.waitForFunction(
      () => localStorage.getItem("sem-admin-nav-expanded-group") === "conversion"
    );

    await side.getByRole("link", { name: "Actividad", exact: true }).click();
    await page.waitForURL("**/admin/actividad**", { waitUntil: "domcontentloaded", timeout: 180000 });
    await assertCrmOpen(side, "actividad");

    await side.getByRole("link", { name: "Inicio", exact: true }).click();
    await page.waitForURL(/\/admin\/?$/, { waitUntil: "domcontentloaded", timeout: 180000 });
    if ((await crmButton(side).getAttribute("aria-expanded")) !== "true") {
      fail("CRM no conservó el estado al volver a Inicio");
    }
    await page.screenshot({ path: resolve(outDir, "desktop-inicio.png") });
    await page.goto(`${baseUrl}/admin/conversion`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Panel comercial" }).waitFor({ timeout: 60000 });
    if ((await page.getByText("Vencidas").count()) < 1) fail("el panel no muestra vencidas");
    if ((await page.locator(".w-72").count()) > 0) fail("el panel duplica el Kanban");
    await page.screenshot({ path: resolve(outDir, "desktop-panel.png"), fullPage: true });

    await page.goto(`${baseUrl}/admin/ventas/mi-trabajo`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Mi trabajo" }).waitFor({ timeout: 60000 });
    await page.getByText(tempName).waitFor({ timeout: 60000 });
    if ((await page.getByText("Tu oportunidad").count()) < 1) {
      fail("Mi trabajo no distingue la oportunidad propia");
    }
    if ((await page.locator(".w-72").count()) > 0) fail("Mi trabajo duplica el Kanban");
    const detail = page.getByRole("link", { name: new RegExp(tempName) });
    const detailHref = await detail.getAttribute("href");
    if (detailHref !== `/admin/ventas/${tempId}`) {
      fail(`Mi trabajo no abre el detalle: ${detailHref}`);
    }
    await page.screenshot({ path: resolve(outDir, "desktop-mi-trabajo.png"), fullPage: true });

    await page.getByRole("button", { name: "Colapsar menú" }).click();
    await crmButton(side).click();
    const flyout = page.locator("#nav-group-conversion");
    if (!(await flyout.isVisible())) fail("el lateral colapsado no abre el grupo");
    if ((await flyout.getByRole("link", { name: "Oportunidades" }).count()) < 1) {
      fail("el flyout no muestra Oportunidades");
    }
    await page.screenshot({ path: resolve(outDir, "desktop-colapsado.png") });
    await desktop.close();
    }

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobile.addCookies([
      { name: "ah_session", value: sessionId, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const phone = await mobile.newPage();
    phone.setDefaultTimeout(120000);
    phone.setDefaultNavigationTimeout(120000);
    await phone.goto(`${baseUrl}/admin/ventas`, { waitUntil: "domcontentloaded" });
    await phone.getByRole("button", { name: "Abrir menú" }).waitFor({ timeout: 20000 });
    const overflow = await phone.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    if (overflow) fail("la página de ventas desborda en móvil");
    const openMenu = phone.getByRole("button", { name: "Abrir menú" });
    await openMenu.click();
    const drawer = phone.getByRole("dialog");
    if (!(await drawer.isVisible().catch(() => false))) await openMenu.click();
    await drawer.waitFor({ timeout: 15000 });
    await phone.screenshot({ path: resolve(outDir, "mobile-menu.png") });
    await assertCrmOpen(drawer, "móvil");
    const drawerBox = await drawer.boundingBox();
    if (!drawerBox || drawerBox.width > 390) fail("el cajón móvil ocupa más que el viewport");
    await phone.screenshot({ path: resolve(outDir, "mobile-menu.png") });
    await drawer.getByRole("link", { name: "Personas", exact: true }).click();
    await phone.waitForURL("**/admin/personas**", { waitUntil: "domcontentloaded", timeout: 180000 });
    if (await drawer.isVisible()) fail("el menú móvil no se cierra al navegar");
    await phone.goto(`${baseUrl}/admin/conversion`, { waitUntil: "domcontentloaded" });
    await phone.getByRole("heading", { name: "Panel comercial" }).waitFor({ timeout: 60000 });
    const panelOverflow = await phone.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    if (panelOverflow) fail("el panel desborda en móvil");
    if ((await phone.locator(".w-72").count()) > 0) fail("el panel móvil duplica el Kanban");
    await phone.screenshot({ path: resolve(outDir, "mobile-panel.png"), fullPage: true });
    await phone.goto(`${baseUrl}/admin/ventas/mi-trabajo`, { waitUntil: "domcontentloaded" });
    await phone.getByText(tempName).waitFor({ timeout: 60000 });
    const workOverflow = await phone.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    if (workOverflow) fail("Mi trabajo desborda en móvil");
    await phone.screenshot({ path: resolve(outDir, "mobile-mi-trabajo.png"), fullPage: true });
    await mobile.close();

    console.log("PASA menú CRM · Conversión escritorio y móvil");
  } finally {
    await browser?.close();
    await db.collection("identity_sessions").deleteOne({ _id: sessionId });
    await db.collection("growth_oportunidades").deleteOne({ _id: tempId, tenantId: String(membership.tenantId) });
    await db.collection("growth_personas").deleteOne({ _id: tempId, tenantId: String(membership.tenantId) });
    await db.collection("growth_actividades").deleteMany({
      tenantId: String(membership.tenantId),
      oportunidadId: tempId,
    });
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
