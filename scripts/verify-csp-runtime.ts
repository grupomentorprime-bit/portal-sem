import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.env.CSP_BASE_URL?.trim().replace(/\/$/, "");
if (!base) {
  console.error("CSP_BASE_URL es obligatorio");
  process.exit(2);
}

const paths = ["/", "/login", "/formularios", "/contacto"];

function scriptSrc(csp: string): string {
  return (
    csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src ")) ?? ""
  );
}

function nonceFromPolicy(script: string): string | null {
  const match = script.match(/'nonce-([^']+)'/);
  return match?.[1] ?? null;
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
const evidence: {
  base: string;
  checkedAt: string;
  passed: boolean;
  pages: Array<Record<string, unknown>>;
} = {
  base,
  checkedAt: new Date().toISOString(),
  passed: false,
  pages: [],
};

const targets: Array<{ label: string; url: string; origin: string; hostHeader?: string }> =
  paths.map((pagePath) => ({
    label: pagePath,
    url: `${base}${pagePath}`,
    origin: new URL(base).origin,
  }));
const cumpleHost = process.env.CSP_CUMPLE_HOST?.trim();
if (cumpleHost) {
  const port = new URL(base).port || "80";
  targets.push({
    label: `cumple:${cumpleHost}`,
    url: `http://127.0.0.1:${port}/`,
    origin: `http://127.0.0.1:${port}`,
    hostHeader: cumpleHost,
  });
}

let failed = false;
try {
  for (const target of targets) {
    const page = await browser.newPage();
    if (target.hostHeader) {
      const header = target.hostHeader;
      await page.route(`${target.origin}/**`, async (route) => {
        try {
          const headers = { ...route.request().headers(), host: header };
          await route.fulfill({ response: await route.fetch({ headers }) });
        } catch {
          await route.abort().catch(() => undefined);
        }
      });
    }
    const response = await page.goto(target.url, { waitUntil: "domcontentloaded" });
    const finalUrl = page.url();
    const sameOrigin = Boolean(finalUrl) && new URL(finalUrl).origin === target.origin;
    const status = response?.status() ?? 0;
    const csp = response?.headers()["content-security-policy"] ?? "";
    const script = scriptSrc(csp);
    const nonce = nonceFromPolicy(script);
    const unsafeInline = script.includes("'unsafe-inline'");
    const unsafeEval = script.includes("'unsafe-eval'");
    // El navegador oculta el atributo nonce en el DOM. La evidencia sale del HTML de la respuesta.
    const html = (await response?.text()) ?? "";
    const scriptTags = [...html.matchAll(/<script\b([^>]*)>/gi)];
    const executableScripts = scriptTags.filter((match) => {
      const attrs = match[1] ?? "";
      return !/\stype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attrs);
    });
    const inlineMissingNonce = executableScripts.filter((match) => {
      const attrs = match[1] ?? "";
      if (!nonce) return true;
      return !attrs.includes(`nonce="${nonce}"`) && !attrs.includes(`nonce='${nonce}'`);
    });

    await page.addScriptTag({ content: "window.__cspBlocked = true" }).catch(() => undefined);
    const blockedProbe = await page.evaluate(() => (window as unknown as { __cspBlocked?: boolean }).__cspBlocked === true);

    let nonceRan = false;
    if (nonce) {
      nonceRan = await page.evaluate((value) => {
        const tag = document.createElement("script");
        tag.nonce = value;
        tag.text = "window.__cspNonce = true";
        document.head.appendChild(tag);
        return (window as unknown as { __cspNonce?: boolean }).__cspNonce === true;
      }, nonce);
    }

    const externalBlocked = await page.evaluate(async () => {
      const tag = document.createElement("script");
      tag.src = "https://example.invalid/csp-probe.js";
      const blocked = new Promise<boolean>((resolve) => {
        tag.onload = () => resolve(false);
        tag.onerror = () => resolve(true);
      });
      document.head.appendChild(tag);
      return blocked;
    });

    const pageOk =
      sameOrigin &&
      status > 0 &&
      status < 500 &&
      Boolean(nonce) &&
      !unsafeInline &&
      !unsafeEval &&
      executableScripts.length > 0 &&
      inlineMissingNonce.length === 0 &&
      blockedProbe === false &&
      nonceRan &&
      externalBlocked;

    if (!pageOk) failed = true;
    evidence.pages.push({
      path: target.label,
      finalUrl,
      sameOrigin,
      status,
      nonce: Boolean(nonce),
      unsafeInline,
      unsafeEval,
      executableScripts: executableScripts.length,
      scriptsMissingNonce: inlineMissingNonce.length,
      blockedProbe,
      nonceRan,
      externalBlocked,
      ok: pageOk,
    });
    await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => undefined);
    await page.close();
  }
} finally {
  await browser.close();
}

evidence.passed = !failed && evidence.pages.length === targets.length;
const target = "docs/seguridad/csp-runtime-evidence.json";
writeFileSync(target, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.passed) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "csp");
  process.exit(1);
});
