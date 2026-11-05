/**
 * Captura visual de la ficha de Persona (escritorio y móvil).
 * Uso: npx tsx --env-file=.env scripts/capture-persona-ficha.ts
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
const preferredId = process.env.CAPTURE_PERSONA_ID?.trim() || "6ad2fa8ecd5ac7d376f487a1";
const outDir = resolve("docs/validation/persona-ficha-visual");
mkdirSync(outDir, { recursive: true });

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  const personas = db.collection("growth_personas");
  const persona =
    (await personas.findOne({ _id: preferredId as never })) ??
    (await personas.findOne({ status: { $ne: "merged" } }, { sort: { updatedAt: -1 } }));
  if (!persona?.tenantId || !persona._id) {
    console.error("Sin persona para capturar");
    process.exit(1);
  }
  const tenantId = String(persona.tenantId);
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
  const sessionId = `sess-persona-ficha-${Date.now().toString(36)}`;
  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(membership.userId),
    tenantId,
    createdAt: now,
    expiresAt: expires,
    lastActivity: now,
  });

  const browser = await chromium.launch({ headless: true });
  const href = `${baseUrl}/admin/personas/${encodeURIComponent(String(persona._id))}`;
  try {
    for (const shot of [
      { name: "desktop", width: 1440, height: 1100 },
      { name: "mobile", width: 390, height: 844 },
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
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.waitForSelector("[data-persona-detail]", { timeout: 60000 });
      await page.waitForTimeout(1200);
      const path = resolve(outDir, `${shot.name}.png`);
      await page.screenshot({ path, fullPage: true });
      console.log("saved", path, "title", await page.title(), "url", page.url());
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
