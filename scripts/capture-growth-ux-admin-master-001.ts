/**
 * Capturas OT-GROWTH-UX-ADMIN-MASTER-001.
 * Actual /admin · maqueta con datos · maqueta vacía · comparativa.
 * Uso: npm run dev → npx tsx --env-file=.env scripts/capture-growth-ux-admin-master-001.ts
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";
import sharp from "sharp";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) {
  console.error("Faltan MONGODB_URI / MONGODB_DB");
  process.exit(1);
}

const preferredTenant = process.env.CAPTURE_TENANT_ID?.trim() || "adl";
const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve("docs/validation/OT-GROWTH-UX-ADMIN-MASTER-001");
mkdirSync(outDir, { recursive: true });

async function sideBySide(
  leftPath: string,
  rightPath: string,
  leftLabel: string,
  rightLabel: string,
  outPath: string
) {
  const width = 720;
  const labelH = 36;
  const leftBuf = await sharp(leftPath)
    .resize({ width, withoutEnlargement: true })
    .png()
    .toBuffer();
  const rightBuf = await sharp(rightPath)
    .resize({ width, withoutEnlargement: true })
    .png()
    .toBuffer();
  const leftMeta = await sharp(leftBuf).metadata();
  const rightMeta = await sharp(rightBuf).metadata();
  const colH = Math.max(leftMeta.height ?? 0, rightMeta.height ?? 0);
  const canvasW = width * 2 + 16;
  const canvasH = colH + labelH + 12;
  const svg = Buffer.from(`
    <svg width="${canvasW}" height="${canvasH}">
      <rect width="100%" height="100%" fill="#f4f7fb"/>
      <text x="16" y="24" font-family="Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#0e4f90">${leftLabel}</text>
      <text x="${width + 24}" y="24" font-family="Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#0e4f90">${rightLabel}</text>
    </svg>
  `);

  await sharp(svg)
    .composite([
      { input: leftBuf, top: labelH, left: 0 },
      { input: rightBuf, top: labelH, left: width + 16 },
    ])
    .png()
    .toFile(outPath);
}

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
  const sessionId = `sess-ux-admin-master-001-${Date.now()}`;
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

  await page.goto(`${baseUrl}/admin`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await hideDevOverlay();
  await page.waitForTimeout(900);
  const actualPath = resolve(outDir, "admin-actual.png");
  await page.screenshot({ path: actualPath, fullPage: true });
  console.log("saved admin-actual.png");

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

  const comparePath = resolve(outDir, "admin-master-compare.png");
  await sideBySide(
    actualPath,
    dataPath,
    "Actual /admin",
    "Maqueta maestra",
    comparePath
  );
  console.log("saved admin-master-compare.png");

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
