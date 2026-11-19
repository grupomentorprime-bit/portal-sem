import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { sanitizeHtml, sanitizeSvgMarkup } from "../../src/lib/cms/sanitize";
import { buildContentSecurityPolicy } from "../../src/core/security/http-headers";
import {
  CSP_RUNTIME_CHECK,
  productionScriptPolicyStatus,
} from "../../src/core/security/csp-control";

describe("sanitizador HTML y SVG", () => {
  it("conserva un párrafo con enlace https", () => {
    const html = sanitizeHtml('<p>Hola <a href="https://ejemplo.test/guia">guía</a></p>');
    assert.match(html, /<p>Hola/);
    assert.match(html, /href="https:\/\/ejemplo\.test\/guia"/);
  });

  it("descarta script, un evento, javascript y un marcado mal cerrado", () => {
    const html = sanitizeHtml(
      '<p>Texto</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a><p>abierto'
    );
    assert.equal(html.toLowerCase().includes("script"), false);
    assert.equal(html.toLowerCase().includes("onerror"), false);
    assert.equal(html.toLowerCase().includes("javascript:"), false);
    assert.match(html, /Texto/);
  });

  it("el SVG usa otra política y conserva viewBox", () => {
    const svg = sanitizeSvgMarkup(
      '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0" onload="alert(1)"/><a href="javascript:alert(1)"><text>x</text></a></svg>'
    );
    assert.match(svg, /viewBox="0 0 10 10"/);
    assert.equal(svg.toLowerCase().includes("script"), false);
    assert.equal(svg.toLowerCase().includes("onload"), false);
    assert.equal(svg.toLowerCase().includes("javascript:"), false);
  });

  it("los bloques públicos pasan por el sanitizador", () => {
    const htmlBlock = readFileSync("src/components/blocks/HtmlBlock.tsx", "utf8");
    const markdown = readFileSync("src/components/blocks/MarkdownBlock.tsx", "utf8");
    const svg = readFileSync("src/lib/cms/media-processing.ts", "utf8");
    assert.match(htmlBlock, /sanitizeHtml/);
    assert.match(markdown, /markdownToHtml/);
    assert.match(svg, /sanitizeSvgMarkup/);
    assert.doesNotMatch(readFileSync("src/lib/cms/sanitize.ts", "utf8"), /FORBIDDEN_TAGS/);
  });
});

describe("CSP como control separado", () => {
  it("la política de producción quita el script inline y aún no está verificada en el navegador", () => {
    const csp = buildContentSecurityPolicy(
      { NODE_ENV: "production" },
      { nonce: "sintetico" }
    );
    const status = productionScriptPolicyStatus(csp);
    assert.equal(status.unsafeInline, false);
    assert.match(csp, /script-src 'self' 'nonce-sintetico'/);
    assert.match(csp, /form-action 'self'/);
    assert.equal(CSP_RUNTIME_CHECK.verified, false);
    const cumple = readFileSync("src/components/sites/cumple/CumpleShell.tsx", "utf8");
    const structured = readFileSync("src/components/portal/seo/PortalStructuredData.tsx", "utf8");
    assert.match(cumple, /nonce=\{nonce\}/);
    assert.match(structured, /nonce=\{nonce\}/);
    const proxy = readFileSync("src/proxy.ts", "utf8");
    assert.match(proxy, /buildContentSecurityPolicy/);
    assert.doesNotMatch(readFileSync("next.config.ts", "utf8"), /contentSecurityPolicy/);
  });
});
