/**
 * OT-GROWTH-UX-SPACE-CREATION-001 — capturas Crear Espacio (Platform Admin).
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-space-creation-001.ts
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

const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve(
  "docs/AI/auditorias/OT-GROWTH-UX-SPACE-CREATION-001-evidence"
);
mkdirSync(outDir, { recursive: true });

async function hideDevChrome(page: import("playwright").Page) {
  await page.evaluate(() => {
    document.querySelector("nextjs-portal")?.remove();
    document
      .querySelectorAll("[data-nextjs-toast],[data-next-badge-root]")
      .forEach((el) => el.remove());
  });
}

async function main() {
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const user = await db.collection("identity_users").findOne({
    status: "active",
    platformRoles: { $in: ["platform_owner", "platform_operator"] },
  });
  if (!user) {
    console.error("No platform operator user found");
    process.exit(1);
  }

  const membership = await db.collection("identity_memberships").findOne({
    userId: String(user._id),
    status: "active",
  });

  const now = new Date().toISOString();
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);
  const sessionId = `sess-ux-space-creation-001-${Date.now().toString(36)}`;

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId: membership?.tenantId ?? "platform",
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

  console.log(`capture user=${String(user._id)} baseUrl=${baseUrl}`);

  const browser = await chromium.launch({ headless: true });

  // Desktop — modal Crear Espacio
  {
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
    await page.goto(`${baseUrl}/platform`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await hideDevChrome(page);
    await page.getByRole("button", { name: "Crear Espacio" }).first().click();
    await page.getByLabel("Nombre del Espacio").waitFor({ state: "visible" });
    await page.getByLabel("Nombre del Espacio").fill("Mentor Capacitación");
    await page
      .getByLabel("¿Qué tipo de organización es?")
      .selectOption("education");
    await page.waitForTimeout(400);
    await hideDevChrome(page);
    await page.screenshot({
      path: resolve(outDir, "01-desktop-crear-espacio.png"),
      fullPage: false,
    });
    console.log("saved 01-desktop-crear-espacio.png");

    await page.getByRole("button", { name: /Opciones avanzadas|Mostrar/i }).click();
    await page.waitForTimeout(300);
    await hideDevChrome(page);
    await page.screenshot({
      path: resolve(outDir, "02-desktop-avanzadas.png"),
      fullPage: false,
    });
    console.log("saved 02-desktop-avanzadas.png");
    await context.close();
  }

  // Mobile — mismo flujo
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
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
    await page.goto(`${baseUrl}/platform`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await hideDevChrome(page);
    await page.getByRole("button", { name: "Crear Espacio" }).first().click();
    await page.getByLabel("Nombre del Espacio").waitFor({ state: "visible" });
    await page.getByLabel("Nombre del Espacio").fill("Panadería Central");
    await page
      .getByLabel("¿Qué tipo de organización es?")
      .selectOption("business");
    await page.waitForTimeout(400);
    await hideDevChrome(page);
    await page.screenshot({
      path: resolve(outDir, "03-mobile-crear-espacio.png"),
      fullPage: false,
    });
    console.log("saved 03-mobile-crear-espacio.png");
    await context.close();
  }

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();

  writeFileSync(
    resolve(outDir, "RESULT.json"),
    JSON.stringify(
      {
        ot: "OT-GROWTH-UX-SPACE-CREATION-001",
        baseUrl,
        captures: [
          "01-desktop-crear-espacio.png",
          "02-desktop-avanzadas.png",
          "03-mobile-crear-espacio.png",
        ],
        samples: {
          education: "Mentor Capacitación → mentor-capacitacion",
          business: "Panadería Central → panaderia-central",
        },
      },
      null,
      2
    )
  );
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
