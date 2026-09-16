/**
 * OT-GROWTH-UX-SPACE-CREATION-001 — regresión de superficie Crear Espacio.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SPACE_CREATION_ALLOWED_TYPES,
  SPACE_ORGANIZATION_TYPES,
} from "../../src/lib/platform/space-organization-types";
import { labelTenantType } from "../../src/lib/platform/space-labels";
import { normalizeSpaceSlug } from "../../src/core/tenant/create-platform-space";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("OT-GROWTH-UX-SPACE-CREATION-001 — Crear Espacio horizontal", () => {
  it("categorías base amplias (sin rubros específicos)", () => {
    const labels = SPACE_ORGANIZATION_TYPES.map((t) => t.label);
    assert.deepEqual(labels, [
      "Empresa",
      "Educación",
      "Organización social",
      "Comunidad o iglesia",
      "Profesional independiente",
      "Otro",
    ]);
    for (const forbidden of [
      "Panadería",
      "Notaría",
      "OTEC",
      "Consultora",
      "Restaurante",
      "Institución",
      "Academia",
    ]) {
      assert.equal(labels.includes(forbidden), false, forbidden);
    }
  });

  it("labels y contrato aceptan categorías nuevas + legacy", () => {
    assert.equal(labelTenantType("business"), "Empresa");
    assert.equal(labelTenantType("education"), "Educación");
    assert.equal(labelTenantType("social"), "Organización social");
    assert.equal(labelTenantType("community"), "Comunidad o iglesia");
    assert.equal(labelTenantType("independent"), "Profesional independiente");
    assert.equal(labelTenantType("other"), "Otro");
    assert.equal(labelTenantType("institution"), "Institución");
    assert.equal(labelTenantType("academy"), "Academia");
    assert.equal(SPACE_CREATION_ALLOWED_TYPES.has("business"), true);
    assert.equal(SPACE_CREATION_ALLOWED_TYPES.has("institution"), true);
  });

  it("UI propone identificador, oculta Slug técnico y nombre de Sitio duplicado", () => {
    const panel = readSrc("src/components/platform/PlatformCreateSpacePanel.tsx");
    assert.match(panel, /SPACE_ORGANIZATION_TYPES/);
    assert.match(panel, /¿Qué tipo de organización es\?/);
    assert.match(panel, /Identificador del Espacio/);
    assert.match(panel, /Dirección web inicial/);
    assert.match(panel, /Opciones avanzadas/);
    assert.match(panel, /slugify/);
    assert.match(panel, /proposeInitialSpaceHost/);
    assert.match(panel, /siteName:\s*trimmedName/);
    assert.doesNotMatch(panel, /\bSlug\b/);
    assert.doesNotMatch(panel, /Nombre del Sitio/);
    assert.doesNotMatch(panel, /Institución|Academia/);
    assert.doesNotMatch(panel, /Panadería|OTEC|Notaría/);
  });

  it("slug con acentos → identificador legible", () => {
    assert.equal(
      normalizeSpaceSlug("Mentor Capacitación"),
      "mentor-capacitacion"
    );
    assert.equal(
      normalizeSpaceSlug("Panadería Central"),
      "panaderia-central"
    );
  });

  it("no abre onboarding ni motores paralelos desde el panel", () => {
    const panel = readSrc("src/components/platform/PlatformCreateSpacePanel.tsx");
    const service = readSrc("src/core/tenant/create-platform-space.ts");
    assert.match(panel, /\/api\/platform\/spaces/);
    assert.match(service, /provisionTenantFoundation/);
    assert.doesNotMatch(panel, /onboarding|Aprende Hoy|wizard/i);
    assert.doesNotMatch(service, /ensureAdlTenantFoundation|ensureSemTenantFoundation/);
  });
});
