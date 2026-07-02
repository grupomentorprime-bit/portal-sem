/**
 * OT-BRANDING-002 / OT-BRANDING-004 — Validador de identidad visual corporativa
 *
 * Uso:
 *   npm run check:branding              # modo estricto (0 incidencias)
 *   npx tsx scripts/check-branding.ts --update-baseline  # legacy (deprecado)
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, "scripts", "branding-baseline.json");

const BRAND_FILE = "src/styles/tokens/brand.css";
const COLORS_FILE = "src/styles/tokens/colors.css";

const CORPORATE_HEX = new Set([
  "#002a47",
  "#246aa1",
  "#10bce2",
  "#3ed6af",
  "#8ce27f",
]);

const FORBIDDEN_HEX = new Set([
  "#041525",
  "#14c9c3",
  "#0ea5c9",
  "#0577b8",
  "#c9a227",
  "#b8921f",
  "#fff4cc",
  "#1a8a7a",
  "#2563eb",
  "#3b82f6",
  "#0ea5e9",
  "#003b73",
  "#6b7280",
  "#f59e0b",
  "#10b981",
  "#64748b",
  "#94a3b8",
]);

const COLORS_CSS_ALLOWED = new Set([
  "#f5f7f9",
  "#e8ecf0",
  "#d1d9e0",
  "#a8b5c2",
  "#7a8fa3",
  "#5c7289",
  "#475a6e",
  "#354656",
  "#243340",
  "#141f29",
  "#ffffff",
  "#b42318",
]);

/** Únicos archivos autorizados para definir HEX de marca y sistema */
const INFRASTRUCTURE_FILES = new Set([
  BRAND_FILE,
  COLORS_FILE,
  "src/design/tokens/colors.ts",
  "src/design/tokens/shadow.ts",
]);

/** CSS de infraestructura no semántica (sombras rgba institucionales) */
const CSS_INFRASTRUCTURE = new Set([
  "src/styles/design-tokens.css",
]);

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".css", ".scss", ".jsx", ".js"]);

const HEX_RE = /#([0-9A-Fa-f]{3,8})\b/g;
const RGB_RE = /\b(?:rgba?|hsla?)\(\s*[^)]+\)/g;
const INLINE_STYLE_RE =
  /(?:background(?:Color)?|color|borderColor)\s*:\s*["'`#][^"'`\n]+/g;

const FORBIDDEN_TW_RE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder)-(?:amber|yellow|orange|gold|zinc|slate|stone|neutral|emerald|red|blue|sky|cyan|indigo|purple|pink|violet|fuchsia|rose|teal|lime|green)(?:-\d+)?(?:\/\d+)?\b/gi;

const SEMANTIC_TW_ALLOW =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder)-(?:primary|secondary|accent|success|danger|warning|muted|foreground|background|surface|border|light|transparent|current)(?:\/\d+)?\b/gi;

interface Violation {
  file: string;
  line: number;
  color: string;
  kind: "hex" | "rgb" | "hsl" | "inline" | "forbidden" | "brand-invalid";
}

function normHex(raw: string): string {
  let h = raw.toLowerCase();
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  if (h.length === 9) {
    h = h.slice(0, 7);
  }
  return h;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function scanFile(filePath: string): Violation[] {
  const file = rel(filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  lines.forEach((lineText, index) => {
    const line = index + 1;

    let match: RegExpExecArray | null;
    HEX_RE.lastIndex = 0;
    while ((match = HEX_RE.exec(lineText))) {
      const color = normHex(`#${match[1]}`);
      if (color === "#000" || color === "#000000") continue;

      if (FORBIDDEN_HEX.has(color)) {
        violations.push({ file, line, color, kind: "forbidden" });
        continue;
      }

      if (file === BRAND_FILE) {
        if (!CORPORATE_HEX.has(color)) {
          violations.push({ file, line, color, kind: "brand-invalid" });
        }
        continue;
      }

      if (file === COLORS_FILE) {
        if (!COLORS_CSS_ALLOWED.has(color) && !CORPORATE_HEX.has(color)) {
          violations.push({ file, line, color, kind: "hex" });
        }
        continue;
      }

      if (INFRASTRUCTURE_FILES.has(file)) continue;

      violations.push({ file, line, color, kind: "hex" });
    }

    RGB_RE.lastIndex = 0;
    while ((match = RGB_RE.exec(lineText))) {
      if (INFRASTRUCTURE_FILES.has(file) || CSS_INFRASTRUCTURE.has(file)) continue;
      if (file.startsWith("src/styles/tokens/")) continue;
      violations.push({ file, line, color: match[0].slice(0, 60), kind: "rgb" });
    }

    INLINE_STYLE_RE.lastIndex = 0;
    while ((match = INLINE_STYLE_RE.exec(lineText))) {
      if (INFRASTRUCTURE_FILES.has(file)) continue;
      const snippet = match[0];
      if (snippet.includes("var(")) continue;
      if (
        /:\s*["'](?:primary|secondary|accent|surface|muted|highlight|default|success|danger|info|warning|gradient)\b/i.test(
          snippet
        )
      ) {
        continue;
      }
      violations.push({ file, line, color: snippet.slice(0, 60), kind: "inline" });
    }

    FORBIDDEN_TW_RE.lastIndex = 0;
    while ((match = FORBIDDEN_TW_RE.exec(lineText))) {
      const token = match[0];
      if (token.includes("var(--")) continue;
      violations.push({ file, line, color: token, kind: "forbidden" });
    }
  });

  return violations;
}

function main(): void {
  const args = process.argv.slice(2);
  const updateBaseline = args.includes("--update-baseline");

  const srcDir = path.join(ROOT, "src");
  const files = walk(srcDir);
  const allViolations = files.flatMap(scanFile);

  if (updateBaseline) {
    const legacy = allViolations.filter(
      (v) => v.kind !== "brand-invalid" && !INFRASTRUCTURE_FILES.has(v.file)
    );
    fs.writeFileSync(
      BASELINE_PATH,
      `${JSON.stringify(
        { version: 1, generatedAt: new Date().toISOString(), entries: legacy },
        null,
        2
      )}\n`
    );
    console.log(`Baseline actualizado: ${legacy.length} entradas`);
    return;
  }

  const brandViolations = allViolations.filter((v) => v.kind === "brand-invalid");
  const outsideTokens = allViolations.filter(
    (v) =>
      v.kind !== "brand-invalid" &&
      !INFRASTRUCTURE_FILES.has(v.file) &&
      v.file !== COLORS_FILE &&
      !CSS_INFRASTRUCTURE.has(v.file)
  );

  let failed = false;
  const errors: string[] = [];

  if (brandViolations.length > 0) {
    failed = true;
    errors.push("Brand Validation Error — brand.css contiene HEX no corporativos:");
    for (const v of brandViolations) {
      errors.push(`  ${v.file}:${v.line}  ${v.color}`);
    }
  }

  if (outsideTokens.length > 0) {
    failed = true;
    errors.push("Branding Validation Error — colores fuera del sistema de tokens:");
    for (const v of outsideTokens.slice(0, 60)) {
      errors.push(`  ${v.file}:${v.line}  [${v.kind}] ${v.color}`);
    }
    if (outsideTokens.length > 60) {
      errors.push(`  … y ${outsideTokens.length - 60} más`);
    }
  }

  if (failed) {
    console.error("\n╔══════════════════════════════════════╗");
    console.error("║     Branding Validation Error        ║");
    console.error("╚══════════════════════════════════════╝\n");
    for (const line of errors) console.error(line);
    console.error("\nVer docs/design/BRANDING-SYSTEM.md\n");
    process.exit(1);
  }

  console.log("✓ Branding validation passed (0 incidencias)");
  console.log(`  Archivos escaneados: ${files.length}`);
  console.log("  Modo: estricto");
}

main();
