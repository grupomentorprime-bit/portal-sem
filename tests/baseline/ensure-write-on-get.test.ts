/**
 * OT-GROWTH-SAAS-004 — GET/listados no deben invocar ensure* que escriben.
 * ensureTenantRoles / ensureSystemDefinitions quedan en login, publish, start y migraciones.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = path.resolve(import.meta.dirname, "../..");

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function getHandlerBody(src: string): string {
  assert.match(src, /export async function GET/);
  const getStart = src.indexOf("export async function GET");
  const rest = src.slice(getStart);
  const nextExport = rest.search(/\nexport async function (?!GET)/);
  return nextExport >= 0 ? rest.slice(0, nextExport) : rest;
}

/** GETs que antes escribían vía ensure* — deben ser lectura pura. */
const FORMER_ENSURE_ON_GET: Array<{ file: string; ensure: string }> = [
  {
    file: "src/app/api/identity/roles/route.ts",
    ensure: "ensureTenantRoles",
  },
  {
    file: "src/app/api/identity/team/route.ts",
    ensure: "ensureTenantRoles",
  },
  {
    file: "src/app/api/identity/roles/[roleId]/permissions/route.ts",
    ensure: "ensureTenantRoles",
  },
  {
    file: "src/app/api/admin/integrations/storage/route.ts",
    ensure: "ensureTenantRoles",
  },
  {
    file: "src/app/api/workflows/definitions/route.ts",
    ensure: "ensureSystemDefinitions",
  },
];

describe("OT-GROWTH-SAAS-004 — GET sin escritura ensure*", () => {
  it("handlers GET no invocan ensureTenantRoles / ensureSystemDefinitions", () => {
    for (const entry of FORMER_ENSURE_ON_GET) {
      const getBody = getHandlerBody(read(entry.file));
      assert.ok(
        !getBody.includes(`await ${entry.ensure}`),
        `${entry.file} GET no debe llamar ${entry.ensure}`
      );
      assert.ok(
        !new RegExp(`${entry.ensure}\\s*\\(`).test(getBody),
        `${entry.file} GET no debe invocar ${entry.ensure}(...)`
      );
    }
  });

  it("ensureTenantRoles sigue disponible para bootstrap/login/migración", () => {
    const src = read("src/lib/identity/roles.ts");
    assert.match(src, /export async function ensureTenantRoles/);
    assert.match(src, /insertOne\(role\)/);
    assert.match(src, /updateOne\(/);
  });

  it("ensureSystemDefinitions sigue disponible para publish/start", () => {
    const src = read("src/lib/workflow/definitions.ts");
    assert.match(src, /export async function ensureSystemDefinitions/);
    assert.match(src, /insertMany\(toInsert\)/);
  });

  it("login / keycloak siguen inicializando roles explícitamente", () => {
    assert.ok(read("src/core/identity/auth/login.ts").includes("ensureTenantRoles"));
    assert.ok(read("src/lib/identity/keycloak-access.ts").includes("ensureTenantRoles"));
  });

  it("listado público de forms GET no siembra defaults (seed solo en POST)", () => {
    const src = read("src/app/api/experience/forms/route.ts");
    const getBlock = src.slice(src.indexOf("export async function GET"));
    const postStart = getBlock.indexOf("export async function POST");
    const getOnly = postStart >= 0 ? getBlock.slice(0, postStart) : getBlock;
    assert.ok(!getOnly.includes("seedExperienceForms"));
    assert.ok(!getOnly.includes("ensureDefaultExperienceForms"));
    assert.ok(src.includes("seedExperienceForms"));
  });

  it("portal público no importa ensureTenantRoles ni ensureSystemDefinitions", () => {
    const publicFiles = [
      "src/app/(site)/page.tsx",
      "src/components/portal/PortalHome.tsx",
      "src/core/portal/renderer/load-page.ts",
    ];
    for (const file of publicFiles) {
      const src = read(file);
      assert.ok(!src.includes("ensureTenantRoles"), file);
      assert.ok(!src.includes("ensureSystemDefinitions"), file);
    }
  });
});
