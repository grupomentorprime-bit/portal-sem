/**
 * Misma precedencia que Next en `next dev`: lo que ya está en el proceso gana.
 * Solo lee el directorio de trabajo. No sube al repositorio padre.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEV_FILES = [".env", ".env.development", ".env.local", ".env.development.local"] as const;

export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

export function mergeNextDevEnv(
  cwd: string,
  base: NodeJS.ProcessEnv = {}
): NodeJS.ProcessEnv {
  const merged: NodeJS.ProcessEnv = { ...base };
  const locked = new Set(
    Object.entries(base)
      .filter(([, value]) => value != null && value !== "")
      .map(([key]) => key)
  );
  for (const filename of DEV_FILES) {
    const path = resolve(cwd, filename);
    if (!existsSync(path)) continue;
    const parsed = parseEnvFile(readFileSync(path, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (locked.has(key)) continue;
      merged[key] = value;
    }
  }
  return merged;
}

export function applyNextDevEnv(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  const merged = mergeNextDevEnv(cwd, env);
  for (const [key, value] of Object.entries(merged)) {
    if (value != null && env[key] == null) env[key] = value;
  }
  return merged;
}
