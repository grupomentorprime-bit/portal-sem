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
    assert.match(
      src,
      /try\s*\{[\s\S]*?readCrossingThresholdLine[\s\S]*?\}\s*catch(?:\s*\([^)]*\))?\s*\{[\s\S]*?threshold\s*=\s*null/
    );
  });
});

describe("puerta del umbral", () => {
  it("login conserva el contrato de entrada y no usa ProductAuthFrame", () => {
    const page = readSrc("src/app/login/page.tsx");
    assert.match(page, /loadSessionContext/);
    assert.match(page, /resolvePostAuthDestination/);
    assert.match(page, /hasPlatformOperatorCapability/);
    assert.match(page, /LoginForm/);
    assert.match(page, /ThresholdLogin/);
    assert.match(page, /readSpaceAttentionCount/);
    assert.match(page, /publicThresholdLine/);
    assert.doesNotMatch(page, /ProductAuthFrame/);
    assert.doesNotMatch(page, /redirect\("\/admin"\)/);
    assert.doesNotMatch(page, /\/api\/identity\/auth\/keycloak\/login/);
  });

  it("el formulario espera el callback y si no hay provider navega solo", () => {
    const form = readSrc("src/components/identity/LoginForm.tsx");
    assert.match(form, /Usuario/);
    assert.match(form, /Contraseña/);
    assert.match(form, /type="password"/);
    assert.match(form, /\/api\/identity\/auth\/keycloak\/session/);
    assert.match(form, /useThresholdOnAuthenticated/);
    assert.match(form, /await onAuthenticated/);
    assert.match(form, /window\.location\.assign\(destination\)/);
    assert.doesNotMatch(form, /href=\{loginHref\}/);
  });

  it("el respiro usa la función pura y escribe la señal antes de abrir", () => {
    const scene = readSrc("src/components/identity/ThresholdLogin.tsx");
    assert.match(scene, /thresholdBreathMs/);
    assert.match(scene, /markThresholdArrival/);
    assert.match(scene, /prefers-reduced-motion: reduce/);
    assert.match(scene, /aria-live="polite"/);
  });

  it("el inicio envuelve la atención y el movimiento se apaga si la persona lo pide", () => {
    const home = readSrc(
      "src/components/admin/preview/growth-os-master/GrowthOsAdminHomeMaster.tsx"
    );
    const arrival = readSrc("src/components/identity/ThresholdArrival.tsx");
    const motion = readSrc("src/styles/foundation/motion.css");
    assert.match(home, /ThresholdArrival/);
    assert.match(home, /Qué necesita atención/);
    assert.match(arrival, /consumeThresholdArrival/);
    assert.match(arrival, /prefers-reduced-motion: reduce/);
    assert.match(motion, /threshold-arrival\[data-threshold-arrival="true"\] > ul > li:first-child/);
    assert.match(motion, /\.threshold-arrival\[data-threshold-arrival="true"\] > :not\(ul\)/);
    const reduceAt = motion.indexOf("@media (prefers-reduced-motion: reduce)");
    const ruleAt = motion.indexOf(".threshold-arrival[data-threshold-arrival=\"true\"]", reduceAt);
    assert.ok(reduceAt > 0 && ruleAt > reduceAt);
  });
});
