/**
 * OT-SEM-VISUAL-001 — Capturas de validación del Dashboard /admin
 *
 * Requisitos:
 *   npm run dev  (con ADMIN_SHELL_V2=true en .env)
 *   npx playwright install chromium
 *
 * Uso:
 *   node scripts/capture-admin-dashboard-visual.mjs
 *
 * Salida: docs/validation/OT-SEM-VISUAL-001/screenshots/
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outRoot = path.join(root, "docs", "validation", "OT-SEM-VISUAL-001", "screenshots");
const baseUrl = process.env.CAPTURE_URL ?? "http://localhost:3000";

const captures = [
  {
    folder: "despues",
    url: "/dev-preview/admin-dashboard",
    files: [
      { name: "dashboard-completo-1920.png", width: 1920, height: 1080, fullPage: true },
      { name: "dashboard-escritorio-1920.png", width: 1920, height: 1080, fullPage: false },
      { name: "dashboard-tablet-768.png", width: 768, height: 1024, fullPage: true },
      { name: "dashboard-mobile-390.png", width: 390, height: 844, fullPage: true },
    ],
  },
  {
    folder: "antes",
    url: "/dev-preview/admin-dashboard?variant=legacy",
    files: [
      { name: "dashboard-legacy-1920.png", width: 1920, height: 1080, fullPage: true },
      { name: "dashboard-legacy-tablet-768.png", width: 768, height: 1024, fullPage: true },
      { name: "dashboard-legacy-mobile-390.png", width: 390, height: 844, fullPage: true },
    ],
  },
];

async function waitForDashboard(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
}

async function main() {
  await mkdir(outRoot, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const group of captures) {
    const dir = path.join(outRoot, group.folder);
    await mkdir(dir, { recursive: true });

    for (const shot of group.files) {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto(`${baseUrl}${group.url}`, { waitUntil: "networkidle", timeout: 60000 });
      await waitForDashboard(page);
      const filePath = path.join(dir, shot.name);
      await page.screenshot({ path: filePath, fullPage: shot.fullPage });
      console.log(`✓ ${group.folder}/${shot.name}`);
    }
  }

  // Comparativa lado a lado (1920 viewport, recortar viewport)
  await page.setViewportSize({ width: 1920, height: 1080 });
  const compareDir = path.join(outRoot, "comparativa");
  await mkdir(compareDir, { recursive: true });

  await page.goto(`${baseUrl}/dev-preview/admin-dashboard?variant=legacy`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await waitForDashboard(page);
  await page.screenshot({
    path: path.join(compareDir, "01-ANTES-shell-v1-legacy.png"),
    fullPage: false,
  });
  console.log("✓ comparativa/01-ANTES-shell-v1-legacy.png");

  await page.goto(`${baseUrl}/dev-preview/admin-dashboard`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await waitForDashboard(page);
  await page.screenshot({
    path: path.join(compareDir, "02-DESPUES-shell-v2-moderno.png"),
    fullPage: false,
  });
  console.log("✓ comparativa/02-DESPUES-shell-v2-moderno.png");

  await browser.close();
  console.log(`\nCapturas guardadas en: ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
