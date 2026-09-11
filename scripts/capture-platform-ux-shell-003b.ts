/**
 * Capturas UX-SHELL-003B (hero + métricas vs referencia).
 * Uso: npx tsx --env-file=.env scripts/capture-platform-ux-shell-003b.ts
 */
import { copyFileSync, mkdirSync } from "fs";
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
  const sessionId = `sess-ux-shell-003b-${Date.now()}`;

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

  await page.goto(`${baseUrl}/platform`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
  });
  await page.waitForTimeout(1000);

  const homePath = resolve(outDir, "platform-home-003b.png");
  await page.screenshot({ path: homePath, fullPage: true });
  console.log("saved platform-home-003b.png");

  // Header zone crop for side-by-side
  const headerPath = resolve(outDir, "platform-header-003b.png");
  await page.screenshot({
    path: headerPath,
    clip: { x: 248, y: 64, width: 1192, height: 360 },
  });
  console.log("saved platform-header-003b.png");

  // Side-by-side with master reference (maqueta en docs/validation)
  const refSrc = resolve(outDir, "maqueta-hero-referencia.jpg");
  const refCrop = resolve(outDir, "_ref-header-zone.png");
  const refMeta = await sharp(refSrc).metadata();
  const rw = refMeta.width ?? 1024;
  const rh = refMeta.height ?? 682;
  await sharp(refSrc)
    .extract({
      left: Math.round(rw * 0.195),
      top: Math.round(rh * 0.09),
      width: Math.round(rw * 0.78),
      height: Math.round(rh * 0.41),
    })
    .resize(1192, 360, { fit: "cover" })
    .png()
    .toFile(refCrop);

  const impl = await sharp(headerPath).resize(1192, 360, { fit: "cover" }).png().toBuffer();
  const ref = await sharp(refCrop).resize(1192, 360, { fit: "cover" }).png().toBuffer();

  const labelH = 36;
  const canvasW = 1192;
  const canvasH = 360 * 2 + labelH * 2 + 12;
  const svgLabels = Buffer.from(`
    <svg width="${canvasW}" height="${canvasH}">
      <rect width="100%" height="100%" fill="#f4f7fb"/>
      <text x="16" y="24" font-family="Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#0e4f90">Referencia maestra</text>
      <text x="16" y="${labelH + 360 + 24}" font-family="Segoe UI, sans-serif" font-size="14" font-weight="600" fill="#0e4f90">Implementación /platform (003B)</text>
    </svg>
  `);

  await sharp(svgLabels)
    .composite([
      { input: ref, top: labelH, left: 0 },
      { input: impl, top: labelH + 360 + labelH + 12, left: 0 },
    ])
    .png()
    .toFile(resolve(outDir, "platform-header-003b-compare.png"));
  console.log("saved platform-header-003b-compare.png");

  // Also refresh canonical home capture name used by OT folder (without declaring APTO)
  copyFileSync(homePath, resolve(outDir, "platform-home.png"));
  console.log("updated platform-home.png");

  await browser.close();
  await db.collection("identity_sessions").deleteOne({ _id: sessionId });
  await client.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
