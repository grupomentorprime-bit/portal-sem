import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("lectura del umbral", () => {
  it("el conteo público suma las tres bandas y no mapea filas", () => {
    const src = readSrc("src/lib/growth/commercial-read.ts");
    assert.match(src, /export async function readSpaceAttentionCount\(tenantId: string\)/);
    assert.match(src, /countGrowthBands\(loaded\.opportunities, loaded\.now, loaded\.staleAfterDays\)/);
    assert.match(src, /counts\.overdue \+ counts\.unfollowed \+ counts\.stale/);
    const body = src.slice(src.indexOf("export async function readSpaceAttentionCount"));
    const nextExport = body.indexOf("\nexport ", 10);
    const fn = nextExport === -1 ? body : body.slice(0, nextExport);
    assert.doesNotMatch(fn, /personaLabel/);
    assert.doesNotMatch(fn, /toRow/);
  });

  it("la frase de cruce no toca el panel si el gate es falso", () => {
    const src = readSrc("src/lib/identity/threshold-read.ts");
    assert.match(src, /import "server-only"/);
    assert.match(src, /crossingMayResolveAccess\(path, hasTenant\)/);
    assert.match(src, /crossingNeedsPanel\(/);
    assert.match(src, /findMembership\(input\.userId, tenantId\)/);
    assert.match(src, /usesStudentAffairsFocusedShell\(permissions, false, roleCodes\)/);
    assert.match(src, /readCommercialPanel\(tenantId, input\.userId, spaceWide\)/);
    const panelAt = src.indexOf("readCommercialPanel(tenantId, input.userId, spaceWide)");
    const needsAt = src.indexOf("crossingNeedsPanel(");
    assert.ok(needsAt > 0 && panelAt > needsAt);
  });

  it("la sesión suma la frase y sigue devolviendo redirectTo si el helper falla", () => {
    const src = readSrc("src/app/api/identity/auth/keycloak/session/route.ts");
    assert.match(src, /resolvePostAuthDestination/);
    assert.match(src, /await\s+loginWithKeycloakPassword/);
    assert.match(src, /redirectTo/);
    assert.match(src, /readCrossingThresholdLine/);
    assert.match(src, /thresholdLine: threshold\.line/);
    assert.match(src, /thresholdArrival: threshold\.announceArrival/);
    assert.match(src, /catch/);
  });
});
