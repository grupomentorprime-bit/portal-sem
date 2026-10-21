/**
 * Comprobación visual del Kanban de Ventas con oportunidades temporales.
 * Uso: npx tsx --env-file=.env scripts/verify-kanban-ui.ts
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/kanban-ui");
mkdirSync(outDir, { recursive: true });

function fail(message: string): never {
  throw new Error(message);
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
    : await db.collection("identity_memberships").findOne({ status: "active", tenantId });
  if (!membership?.userId || !membership.tenantId) fail("sin membresía");
  const user = await db.collection("identity_users").findOne({
    _id: membership.userId,
    status: "active",
  });
  if (!user) fail("sin usuario");

  const now = new Date();
  const iso = now.toISOString();
  const past = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  const staleAt = new Date(now.getTime() - 21 * 86_400_000).toISOString();
  const future = new Date(now.getTime() + 3 * 86_400_000).toISOString();
  const stamp = Date.now();
  const token = `KanbanUI${String(stamp).slice(-6)}`;
  const sessionId = `sess-kanban-ui-${stamp}`;
  const specs = [
    { suffix: "vencida", band: "Vencida", next: { summary: "Llamar hoy", dueAt: past, kind: "contact", setAt: iso } as const, last: iso, opened: iso },
    { suffix: "sinseg", band: "Sin seguimiento", next: null, last: iso, opened: iso },
    { suffix: "estanc", band: "Estancada", next: { summary: "Revisar propuesta", dueAt: future, kind: "review", setAt: staleAt } as const, last: staleAt, opened: staleAt },
    { suffix: "aldia", band: "Al día", next: { summary: "Enviar ficha", dueAt: future, kind: "contact", setAt: iso } as const, last: iso, opened: iso },
  ];
  const ids = specs.map((spec) => `kanban-ui-${stamp}-${spec.suffix}`);

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId: String(membership.tenantId),
    createdAt: iso,
    expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    lastActivity: iso,
  });

  for (let index = 0; index < specs.length; index += 1) {
    const spec = specs[index]!;
    const id = ids[index]!;
    const displayName = `${token} ${spec.suffix}`;
    await db.collection("growth_personas").insertOne({
      _id: id,
      tenantId: String(membership.tenantId),
      status: "active",
      displayName,
      emails: [`${id}@kanban-ui.test`],
      emailNormalized: `${id}@kanban-ui.test`,
      phones: [`+569${String(stamp).slice(-8)}${index}`],
      phoneNormalized: `9${String(stamp).slice(-8)}${index}`,
      origin: { kind: "manual", sourceCollection: "kanban_ui_check", sourceId: id, capturedAt: iso },
      createdAt: iso,
      updatedAt: iso,
    });
    await db.collection("growth_oportunidades").insertOne({
      _id: id,
      tenantId: String(membership.tenantId),
      personaId: id,
      typeKey: "inquiry",
      subjectType: "form",
      origin: { kind: "manual", sourceCollection: "kanban_ui_check", sourceId: id, capturedAt: iso },
      status: "open",
      funnelKey: "default",
      organizationId: null,
      source: { sourceCollection: "kanban_ui_check", sourceId: id },
      workflowInstanceId: id,
      nextAction: spec.next,
      openedAt: spec.opened,
      updatedAt: spec.last,
      lastActivityAt: spec.last,
      ownerUserId: index === 0 ? String(user._id) : undefined,
    });
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await desktop.addCookies([
      { name: "ah_session", value: sessionId, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const page = await desktop.newPage();
    page.setDefaultTimeout(90000);
    await page.goto(
      `${baseUrl}/admin/ventas?vista=kanban&q=${encodeURIComponent(token)}`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    if (page.url().includes("/login")) fail(`login: ${page.url()}`);
    await page.getByRole("link", { name: `${token} vencida` }).waitFor({ timeout: 60000 });
    await page.waitForFunction(() => {
      const lane = document.querySelector(".kanban-lane");
      return lane instanceof HTMLElement && lane.style.getPropertyValue("--kanban-col").endsWith("px");
    });

    const metrics = await page.evaluate(() => {
      const scroller = document.querySelector(".kanban-lane");
      const grid = scroller?.firstElementChild as HTMLElement | null;
      const columns = [...(grid?.querySelectorAll(":scope > section") ?? [])] as HTMLElement[];
      const widths = columns.map((column) => Math.round(column.getBoundingClientRect().width));
      const scrollerBox = scroller?.getBoundingClientRect();
      return {
        columnCount: columns.length,
        widths,
        scrollerWidth: Math.round(scrollerBox?.width ?? 0),
        gridWidth: Math.round(grid?.getBoundingClientRect().width ?? 0),
        scrollWidth: scroller?.scrollWidth ?? 0,
        clientWidth: scroller?.clientWidth ?? 0,
        selects: document.querySelectorAll(".kanban-lane select").length,
        labels: columns.map((column) => column.getAttribute("aria-label")),
      };
    });
    console.log(JSON.stringify(metrics));
    if (metrics.columnCount < 1) fail("sin columnas");
    if (metrics.selects !== 0) fail("los selectores siguen visibles en la tarjeta");
    const minWidth = Math.min(...metrics.widths);
    const maxWidth = Math.max(...metrics.widths);
    if (minWidth < 248 || maxWidth > 324) {
      fail(`columna de escritorio fuera de 248–320 px: ${minWidth}–${maxWidth}`);
    }
    const sliced = await page.evaluate(() => {
      const lane = document.querySelector(".kanban-lane");
      if (!lane) return ["sin carril"];
      const laneBox = lane.getBoundingClientRect();
      const cut = [...lane.querySelectorAll(":scope > div > section")].filter((column) => {
        const box = column.getBoundingClientRect();
        const visible = Math.min(box.right, laneBox.right, window.innerWidth) - Math.max(box.left, laneBox.left);
        return visible > 12 && box.width - visible > 12;
      });
      return cut.map((column) => column.getAttribute("aria-label") ?? "columna");
    });
    if (sliced.length > 0) fail(`columna cortada: ${sliced.join(", ")}`);
    if (metrics.gridWidth > metrics.clientWidth + 8 && metrics.scrollWidth <= metrics.clientWidth + 8) {
      fail("el tablero no permite desplazamiento horizontal");
    }
    const lineClamp = await page.locator(".kanban-lane .line-clamp-2").first().evaluate((element) => {
      return getComputedStyle(element).webkitLineClamp;
    });
    if (lineClamp !== "2") fail(`la próxima acción no queda en dos líneas: ${lineClamp}`);

    for (const spec of specs) {
      const card = page.locator("li", { has: page.getByRole("link", { name: `${token} ${spec.suffix}` }) });
      if ((await card.getByText(spec.band, { exact: true }).count()) < 1) {
        fail(`falta banda ${spec.band}`);
      }
    }

    const actions = page.getByRole("button", { name: `Acciones de ${token} vencida` });
    await actions.click();
    const card = page.locator("li", { has: page.getByRole("link", { name: `${token} vencida` }) });
    if ((await card.getByText("Mover a").count()) < 1) fail("no aparece la alternativa para mover");
    if ((await card.locator("select").count()) < 1) fail("no aparece la asignación");
    await page.screenshot({ path: resolve(outDir, "desktop.png"), fullPage: false });

    const tablet = await browser.newContext({ viewport: { width: 820, height: 1100 } });
    await tablet.addCookies([
      { name: "ah_session", value: sessionId, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const tabletPage = await tablet.newPage();
    await tabletPage.goto(
      `${baseUrl}/admin/ventas?vista=kanban&q=${encodeURIComponent(token)}`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    await tabletPage.getByRole("link", { name: `${token} aldia` }).waitFor();
    await tabletPage.waitForFunction(() => {
      const lane = document.querySelector(".kanban-lane");
      return lane instanceof HTMLElement && lane.style.getPropertyValue("--kanban-col").endsWith("px");
    });
    const tabletWidth = await tabletPage.evaluate(() => {
      const column = document.querySelector(".kanban-lane section");
      return Math.round(column?.getBoundingClientRect().width ?? 0);
    });
    console.log(JSON.stringify({ tabletWidth }));
    if (tabletWidth < 248 || tabletWidth > 324) {
      fail(`columna de tablet fuera de 248–320 px: ${tabletWidth}`);
    }
    await tabletPage.screenshot({ path: resolve(outDir, "tablet.png") });

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobile.addCookies([
      { name: "ah_session", value: sessionId, url: baseUrl, httpOnly: true, sameSite: "Lax" },
    ]);
    const mobilePage = await mobile.newPage();
    await mobilePage.goto(
      `${baseUrl}/admin/ventas?vista=kanban&q=${encodeURIComponent(token)}`,
      { waitUntil: "domcontentloaded", timeout: 120000 }
    );
    await mobilePage.getByRole("link", { name: `${token} vencida` }).waitFor();
    const mobileWidth = await mobilePage.evaluate(() => {
      const column = document.querySelector(".kanban-lane section");
      return Math.round(column?.getBoundingClientRect().width ?? 0);
    });
    console.log(JSON.stringify({ mobileWidth }));
    if (mobileWidth < 280 || mobileWidth > 400) {
      fail(`columna móvil fuera de un ancho cómodo: ${mobileWidth}`);
    }
    await mobilePage.screenshot({ path: resolve(outDir, "mobile.png") });
    console.log("ok");
  } finally {
    await browser.close();
    await db.collection("growth_oportunidades").deleteMany({ _id: { $in: ids } });
    await db.collection("growth_personas").deleteMany({ _id: { $in: ids } });
    await db.collection("growth_activities").deleteMany({ oportunidadId: { $in: ids } });
    await db.collection("identity_sessions").deleteOne({ _id: sessionId });
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
