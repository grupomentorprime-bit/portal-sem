/**
 * OT-SEM-DEMO-001 — Captura de evidencias responsive.
 * Uso: npm run dev (en otra terminal) → node scripts/capture-demo-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const baseUrl = process.env.DEMO_URL ?? "http://localhost:3000";

const viewports = [
  { folder: "desktop", width: 1920, height: 1080, name: "home-desktop-1920.png" },
  { folder: "desktop", width: 1440, height: 900, name: "home-desktop-1440.png" },
  { folder: "desktop", width: 1280, height: 800, name: "home-desktop-1280.png" },
  { folder: "tablet", width: 1024, height: 768, name: "home-tablet-1024.png" },
  { folder: "tablet", width: 768, height: 1024, name: "home-tablet-768.png" },
  { folder: "mobile", width: 390, height: 844, name: "home-mobile-390.png" },
];

const sections = [
  { name: "hero-mobile-390.png", folder: "mobile", width: 390, height: 844, selector: ".portal-hero-premium" },
  { name: "programas-tablet-768.png", folder: "tablet", width: 768, height: 1024, selector: "#programas-destacados" },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    const dir = path.join(root, "docs", "demo", "screenshots", vp.folder);
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(dir, vp.name),
      fullPage: true,
    });
    console.log(`✓ ${vp.folder}/${vp.name}`);
  }

  for (const sec of sections) {
    const dir = path.join(root, "docs", "demo", "screenshots", sec.folder);
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width: sec.width, height: sec.height });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const el = page.locator(sec.selector).first();
    if (await el.count()) {
      await el.screenshot({ path: path.join(dir, sec.name) });
      console.log(`✓ ${sec.folder}/${sec.name}`);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
