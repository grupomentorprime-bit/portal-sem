/**
 * Captura comparativa de la ficha de oportunidad (escritorio y móvil).
 * Uso: npx tsx --env-file=.env scripts/capture-oportunidad-ficha.ts
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

const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const tenantId = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const outDir = resolve("docs/validation/oportunidad-ficha");
mkdirSync(outDir, { recursive: true });

const FINALS = new Set(["won", "lost", "archived", "handed_off"]);

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  const fixture = /kanban-ui|capture-|persona-capture|e2e-|smoke-/i;
  const ranked = await db
    .collection("growth_actividades")
    .aggregate<{ _id: string; n: number }>([
      {
        $match: {
          tenantId,
          kind: { $in: ["opportunity_opened", "opportunity_transitioned"] },
          oportunidadId: { $type: "string" },
        },
      },
      { $group: { _id: "$oportunidadId", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 30 },
    ])
    .toArray();
  const rankedIds = ranked.map((row) => row._id).filter((id) => !fixture.test(id));
  const oportunidades = await db
    .collection("growth_oportunidades")
    .find({
      tenantId,
      ...(rankedIds.length > 0 ? { _id: { $in: rankedIds } } : {}),
    })
    .toArray();
  const usable = oportunidades.filter((item) => !fixture.test(String(item._id)));
  const byRank = new Map(ranked.map((row, index) => [row._id, index]));
  usable.sort((a, b) => (byRank.get(String(a._id)) ?? 99) - (byRank.get(String(b._id)) ?? 99));
  const picked =
    usable.find((item) => item.nextAction && !FINALS.has(String(item.status))) ??
    usable.find((item) => !FINALS.has(String(item.status))) ??
    usable[0];
  const oportunidad =
    picked ??
    (await db.collection("growth_oportunidades").findOne(
      { tenantId, status: { $nin: [...FINALS] } },
      { sort: { updatedAt: -1 } }
    ));
  if (!oportunidad?._id) {
    console.error("Sin oportunidad en", tenantId, "ranked", rankedIds.length, "usable", usable.length);
    process.exit(1);
  }

  const membership = await db.collection("identity_memberships").findOne({
    tenantId,
    status: "active",
  });
  if (!membership?.userId) {
    console.error("Sin membresía", tenantId);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const sessionId = `sess-oportunidad-ficha-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(membership.userId),
    tenantId,
    createdAt: now,
    expiresAt: expires,
    lastActivity: now,
  });

  const browser = await chromium.launch({ headless: true });
  const href = `${baseUrl}/admin/ventas/${encodeURIComponent(String(oportunidad._id))}`;
  console.log("oportunidad", String(oportunidad._id), "status", oportunidad.status);
  try {
    for (const shot of [
      { name: "after-desktop", width: 1440, height: 1100 },
      { name: "after-mobile", width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
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
        style.textContent = "nextjs-portal,[data-nextjs-toast]{display:none!important}";
        document.documentElement.appendChild(style);
      });
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForSelector("[data-oportunidad-ficha]", { timeout: 90000 });
      const disabled = await page.locator("button:disabled").allTextContents();
      console.log(shot.name, "url", page.url());
      console.log(shot.name, "botones deshabilitados", disabled.map((text) => text.trim()).filter(Boolean));
      const stage = page.getByRole("button", { name: "Ganada" });
      if (await stage.count()) {
        const stageDisabled = await stage.isDisabled();
        console.log(shot.name, "Ganada disabled", stageDisabled);
        if (stageDisabled) throw new Error("Ganada aparece deshabilitada");
      }
      const save = page.getByRole("button", { name: "Guardar seguimiento" });
      if (await save.isDisabled()) throw new Error("Guardar seguimiento aparece deshabilitado");
      await page.waitForTimeout(600);
      const viewportPath = resolve(outDir, `${shot.name}-viewport.png`);
      await page.screenshot({ path: viewportPath, fullPage: false });
      const path = resolve(outDir, `${shot.name}.png`);
      await page.screenshot({ path, fullPage: true });
      console.log("saved", path);
      if (shot.name === "after-desktop") {
        await save.click();
        await page.getByText("Escribe qué hay que hacer.").waitFor({ timeout: 5000 });
        console.log("validación de seguimiento vacío: ok");
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await db.collection("identity_sessions").deleteOne({ _id: sessionId as never });
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
