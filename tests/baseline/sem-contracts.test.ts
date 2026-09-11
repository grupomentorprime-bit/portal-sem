import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  createSemDefaultForms,
  SEM_DEFAULT_FORM_IDS,
} from "../../src/core/experience/forms/defaults";
import {
  FORM_CONVOCATORIAS,
  getActiveConvocatoria,
} from "../../src/lib/admin/forms-center";
import { isFocusedFormPath } from "../../src/lib/portal/form-focused";
import {
  CONVOCATORIA_GENERATIONS,
  normalizeGenerationValue,
} from "../../src/lib/experience/forms/generations";
import {
  PORTAL_ROLE_CODES,
  ROLE_CODES,
  resolveRoleCode,
} from "../../src/core/identity/roles/codes";
import { getTenantRolesForSync } from "../../src/core/identity/roles/defaults";
import { SYSTEM_WORKFLOW_TEMPLATES } from "../../src/core/workflow/definitions/defaults";
import {
  isIdentityEnforced,
  isKeycloakOnlyAuth,
  SESSION_COOKIE,
} from "../../src/core/identity/auth/config";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("OT-GROWTH-TEST-001 — contratos SEM a preservar", () => {
  it("cookie de sesión y enforce de identity son fijos", () => {
    assert.equal(SESSION_COOKIE, "ah_session");
    assert.equal(isIdentityEnforced(), true);
  });

  it("AUTH_BACKEND=keycloak implica solo Keycloak", () => {
    const prev = process.env.AUTH_BACKEND;
    process.env.AUTH_BACKEND = "keycloak";
    try {
      assert.equal(isKeycloakOnlyAuth(), true);
    } finally {
      if (prev === undefined) delete process.env.AUTH_BACKEND;
      else process.env.AUTH_BACKEND = prev;
    }
  });

  it("roles portal SEM: 8 códigos estables", () => {
    assert.deepEqual(PORTAL_ROLE_CODES, [
      ROLE_CODES.SUPER_ADMIN,
      ROLE_CODES.INSTITUTION_ADMIN,
      ROLE_CODES.SUPPORT,
      ROLE_CODES.ADMISSIONS,
      ROLE_CODES.STUDENT_AFFAIRS,
      ROLE_CODES.COMMUNICATIONS,
      ROLE_CODES.REVIEWER,
      ROLE_CODES.GUEST,
    ]);
    assert.equal(getTenantRolesForSync("portal").length, 8);
    assert.equal(resolveRoleCode("Tenant Owner"), ROLE_CODES.SUPER_ADMIN);
  });

  it("formularios base SEM incluyen convocatoria Talca Aurora y testimonio privado", () => {
    assert.ok(SEM_DEFAULT_FORM_IDS.includes("convocatoria-talca-aurora-jul-2026"));
    assert.ok(SEM_DEFAULT_FORM_IDS.includes("testimonial-submission"));
    const forms = createSemDefaultForms("seminario-ipn");
    assert.equal(forms.length, SEM_DEFAULT_FORM_IDS.length);
    assert.ok(forms.every((f) => f.tenant === "seminario-ipn"));
    const testimonio = forms.find((f) => f._id === "testimonial-submission");
    assert.equal(testimonio?.private, true);
    assert.equal(testimonio?.visible, false);
  });

  it("convocatoria activa SEM es Talca Aurora jul-2026", () => {
    const active = getActiveConvocatoria();
    assert.ok(active);
    assert.equal(active!.slug, "talca-aurora-jul-2026");
    assert.equal(active!.formId, "convocatoria-talca-aurora-jul-2026");
    assert.equal(FORM_CONVOCATORIAS.filter((c) => c.active).length, 1);
  });

  it("catálogo de generaciones SEM (G-2023…G-2026 + staff + other)", () => {
    assert.deepEqual(
      CONVOCATORIA_GENERATIONS.map((g) => g.value),
      ["G-2023", "G-2024", "G-2025", "G-2026", "staff", "other"]
    );
    assert.equal(normalizeGenerationValue("g2026"), "G-2026");
    assert.equal(normalizeGenerationValue("Equipo docente"), "staff");
  });

  it("rutas de formulario individual son focused", () => {
    assert.equal(isFocusedFormPath("/formularios/convocatoria-talca-aurora-jul-2026"), true);
    assert.equal(isFocusedFormPath("/formularios"), false);
    assert.equal(isFocusedFormPath("/formularios/convocatorias/talca-aurora-jul-2026"), false);
  });

  it("plantillas de workflow sistema incluyen cms.page", () => {
    const keys = SYSTEM_WORKFLOW_TEMPLATES.map((t) => t.key);
    assert.ok(keys.includes("cms.page"));
    assert.ok(keys.includes("academy.program"));
    assert.ok(keys.includes("content.news"));
  });

  it("archivos de recorridos críticos existen en el árbol", () => {
    const critical = [
      "src/app/(site)/page.tsx",
      "src/app/(site)/programas/page.tsx",
      "src/app/(site)/admision/page.tsx",
      "src/app/(site)/formularios/page.tsx",
      "src/app/(site)/formularios/[id]/page.tsx",
      "src/app/(site)/formularios/convocatorias/[slug]/page.tsx",
      "src/app/(site)/asistencia/justificar/[submissionId]/page.tsx",
      "src/app/admin/login/page.tsx",
      "src/app/admin/pages/page.tsx",
      "src/app/api/admission/apply/route.ts",
      "src/app/api/cms/config/route.ts",
      "src/app/api/cms/pages/route.ts",
      "src/app/api/experience/forms/[id]/public/route.ts",
      "src/app/api/experience/forms/[id]/submit/route.ts",
      "src/app/api/identity/auth/keycloak/callback/route.ts",
      "src/app/api/identity/auth/keycloak/session/route.ts",
      "src/proxy.ts",
      "src/core/admission/admission-adapter.ts",
    ];
    for (const rel of critical) {
      assert.ok(existsSync(path.join(ROOT, rel)), `falta ${rel}`);
    }
  });
});
