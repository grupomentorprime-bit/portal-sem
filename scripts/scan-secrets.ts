import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { formatSecretFindings, scanTextForSecrets } from "../src/core/security/secret-scan";

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "coverage", "tmp"]);

function walk(dir: string, root: string, hits: string[]): void {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) {
      walk(full, root, hits);
      continue;
    }
    if (info.size > 1_000_000) continue;
    if (!/\.(ts|tsx|js|mjs|json|yml|yaml|env|md|txt)$/.test(name)) continue;
    const text = readFileSync(full, "utf8");
    const findings = scanTextForSecrets(text);
    if (findings.length) hits.push(formatSecretFindings(relative(root, full), findings));
  }
}

const root = process.cwd();
const hits: string[] = [];
walk(root, root, hits);
if (hits.length) {
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log("secret-scan: sin hallazgos");
