/**
 * Capturas OT-GROWTH-UX-SHELL-003 (corrección final visual).
 * Uso (dev en :3000): npx tsx --env-file=.env scripts/capture-platform-ux-shell-003.ts
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

const baseUrl = process.env.CAPTURE_URL ?? "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-UX-SHELL-003");
mkdirSync(outDir, { recursive: true });

async function main() {
  const client = new MongoClient(uri);
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
  const sessionId = `sess-ux-shell-003-final-${Date.now()}`;

  await db.collection("identity_sessions").insertOne({
    _id: sessionId,
    userId: String(user._id),
    tenantId: membership?.tenantId ?? "platform",
    createdAt: now,
    expiresAt: expires.toISOString(),
    lastActivity: now,
  });

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

  async function hideDevChrome() {
    await page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
  }

  await page.goto(`${baseUrl}/platform`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevChrome();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "platform-home.png"),
    fullPage: true,
  });
  console.log("saved platform-home.png");

  await page.goto(`${baseUrl}/platform/spaces/adl`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevChrome();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: resolve(outDir, "platform-space-adl.png"),
    fullPage: true,
  });
  console.log("saved platform-space-adl.png");

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
