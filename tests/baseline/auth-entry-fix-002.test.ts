/**
 * OT-GROWTH-AUTH-ENTRY-FIX-002 — destino post-auth según tipo de usuario.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
require("../../scripts/_stub-server-only.cjs");

import { PLATFORM_ADMIN_HOME } from "../../src/core/identity/platform/codes";
import {
  evaluatePlatformOperatorAccess,
  hasPlatformOperatorCapability,
} from "../../src/core/identity/platform/capability";
import { resolvePostAuthDestination } from "../../src/core/identity/platform/landing";
import { pickActiveTenantId } from "../../src/core/identity/spaces/pick-active-tenant";

const ROOT = process.cwd();
const SEM = "seminario-ipn";
const ADL = "adl";

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("OT-GROWTH-AUTH-ENTRY-FIX-002 — resolvePostAuthDestination", () => {
  it("A · operador + membresía SEM → /platform", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: true,
        next: "/admin",
      }),
      PLATFORM_ADMIN_HOME
    );
  });

  it("B · operador + varias membresías → /platform", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: true,
        next: null,
      }),
      PLATFORM_ADMIN_HOME
    );
  });

  it("C · usuario normal + solo SEM → /admin", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: false,
        next: null,
      }),
      "/admin"
    );
    assert.equal(pickActiveTenantId([{ tenantId: SEM, joinedAt: "2026-01-01T00:00:00.000Z" }]), SEM);
  });

  it("D · usuario normal + solo ADL → /admin (ADL activo vía picker)", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: false,
        next: null,
      }),
      "/admin"
    );
    assert.equal(pickActiveTenantId([{ tenantId: ADL, joinedAt: "2026-01-01T00:00:00.000Z" }]), ADL);
  });

  it("E · varios Espacios + último/preferred válido → ese Espacio", () => {
    const many = [
      { tenantId: SEM, joinedAt: "2026-01-01T00:00:00.000Z" },
      { tenantId: ADL, joinedAt: "2026-02-01T00:00:00.000Z" },
    ];
    assert.equal(pickActiveTenantId(many, ADL), ADL);
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: false,
        next: null,
      }),
      "/admin"
    );
  });

  it("F · varios Espacios sin preferred válido → primer joinedAt (selector/switcher existente en UI)", () => {
    const many = [
      { tenantId: SEM, joinedAt: "2026-01-01T00:00:00.000Z" },
      { tenantId: ADL, joinedAt: "2026-02-01T00:00:00.000Z" },
    ];
    assert.equal(pickActiveTenantId(many, "no-existe"), SEM);
    assert.equal(pickActiveTenantId(many), SEM);
  });

  it("G · sin Espacio → /admin/sin-espacio", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: false,
        isPlatformOperator: false,
        next: null,
      }),
      "/admin/sin-espacio"
    );
  });

  it("H · no se obtiene /platform falsificando next sin rol global", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: false,
        next: "/platform",
      }),
      "/admin"
    );
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: false,
        isPlatformOperator: false,
        next: "/platform/spaces/seminario-ipn",
      }),
      "/admin/sin-espacio"
    );
    assert.equal(
      hasPlatformOperatorCapability({
        status: "active",
        platformRoles: [],
      }),
      false
    );
    assert.equal(
      evaluatePlatformOperatorAccess({
        user: { status: "active", platformRoles: [] },
        session: { _id: "s1" },
        membership: { tenantId: SEM, roleIds: ["super_admin"] },
        activeTenantId: SEM,
      }).allowed,
      false
    );
  });

  it("operador sin Espacio → /platform; next profundo /platform se conserva", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: false,
        isPlatformOperator: true,
        next: null,
      }),
      PLATFORM_ADMIN_HOME
    );
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: true,
        next: "/platform/spaces/adl",
      }),
      "/platform/spaces/adl"
    );
  });

  it("usuario normal conserva next profundo no-default", () => {
    assert.equal(
      resolvePostAuthDestination({
        hasSpace: true,
        isPlatformOperator: false,
        next: "/admin/personas",
      }),
      "/admin/personas"
    );
  });
});

describe("OT-GROWTH-AUTH-ENTRY-FIX-002 — un solo resolver en puntos de entrada", () => {
  it("callback Keycloak, session embebida y login email usan resolvePostAuthDestination", () => {
    const callback = readSrc("src/app/api/identity/auth/keycloak/callback/route.ts");
    const session = readSrc("src/app/api/identity/auth/keycloak/session/route.ts");
    const login = readSrc("src/app/api/identity/login/route.ts");
    const landing = readSrc("src/core/identity/platform/landing.ts");

    assert.match(callback, /resolvePostAuthDestination/);
    assert.match(callback, /hasPlatformOperatorCapability/);
    assert.match(session, /resolvePostAuthDestination/);
    assert.match(session, /hasPlatformOperatorCapability/);
    assert.match(login, /resolvePostAuthDestination/);
    assert.match(login, /redirectTo/);

    assert.match(landing, /Operador de plataforma/);
    assert.match(landing, /siempre Growth OS Master/);
    // Prioridad operador antes de hasSpace → /admin
    const opIdx = landing.indexOf("if (input.isPlatformOperator)");
    const noSpaceIdx = landing.indexOf("if (!input.hasSpace)");
    assert.ok(opIdx > 0 && noSpaceIdx > opIdx, "operador debe evaluarse antes que sin-espacio");
  });

  it("capacidad de operador solo desde platformRoles (no email/tenant)", () => {
    const cap = readSrc("src/core/identity/platform/capability.ts");
    assert.match(cap, /platformRoles/);
    assert.match(cap, /No usa membresía/);
    assert.doesNotMatch(cap, /soporte@mentorprime|marco@|hardcode/i);
    assert.doesNotMatch(cap, /activeTenantId\s*===|membership\.role/);
  });
});
