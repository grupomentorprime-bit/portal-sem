/**
 * OT-GROWTH-LEGAL-PLATFORM-001 — capturas públicas legales de plataforma.
 * Uso: npm run dev → npx tsx scripts/capture-growth-legal-platform-001.ts
 */
import { mkdirSync } from "fs";
import { resolve } from "path";
import { chromium } from "playwright";

const baseUrl = process.env.CAPTURE_URL?.trim() || "http://localhost:3000";
const outDir = resolve(
  "docs/AI/auditorias/OT-GROWTH-LEGAL-PLATFORM-001-evidence"
);
mkdirSync(outDir, { recursive: true });

const pages = [
  ["privacidad", "/legal/privacidad"],
  ["terminos", "/legal/terminos"],
  ["eliminacion", "/legal/eliminacion-de-datos"],
] as const;

const viewports = [
  ["desktop", 1280, 800],
  ["mobile", 390, 844],
] as const;

async function main() {
  const browser = await chromium.launch();
  for (const [name, path] of pages) {
    for (const [vp, width, height] of viewports) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(`${baseUrl}${path}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      await page.evaluate(() => {
        document.querySelector("nextjs-portal")?.remove();
        document
          .querySelectorAll("[data-nextjs-toast],[data-next-badge-root]")
          .forEach((el) => el.remove());
      });
      const file = resolve(outDir, `${name}-${vp}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await page.close();
      console.log("ok", name, vp);
    }
  }
  await browser.close();
  console.log("done", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
