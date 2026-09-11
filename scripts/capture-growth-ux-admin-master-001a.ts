/**
 * Capturas OT-GROWTH-UX-ADMIN-MASTER-001A.
 * Maqueta con datos · maqueta vacía.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-admin-master-001a.ts
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
const outDir = resolve("docs/validation/OT-GROWTH-UX-ADMIN-MASTER-001A");
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
  const sessionId = `sess-ux-admin-master-001a-${Date.now()}`;
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

  await page.goto(`${baseUrl}/dev-preview/admin-master`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  const dataPath = resolve(outDir, "admin-master-data.png");
  await page.screenshot({ path: dataPath, fullPage: true });
  console.log("saved admin-master-data.png");

  await page.goto(`${baseUrl}/dev-preview/admin-master?empty=1`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  const emptyPath = resolve(outDir, "admin-master-empty.png");
  await page.screenshot({ path: emptyPath, fullPage: true });
  console.log("saved admin-master-empty.png");

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
