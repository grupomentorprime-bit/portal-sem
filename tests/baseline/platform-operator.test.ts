/**
 * OT-GROWTH-PROD-005 — frontera operador Growth OS vs admin de Espacio.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";
import { SESSION_COOKIE } from "../../src/core/identity/auth/config";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import {
  PLATFORM_ROLES,
  getTenantRolesForSync,
} from "../../src/core/identity/roles/defaults";
import {
  PLATFORM_ADMIN_HOME,
  PLATFORM_ROLE_CODES,
} from "../../src/core/identity/platform/codes";
import {
  evaluatePlatformOperatorAccess,
  hasPlatformOperatorCapability,
} from "../../src/core/identity/platform/capability";
import { resolvePostAuthDestination } from "../../src/core/identity/platform/landing";
import {
  isPlatformAuditEntry,
  platformAuditFilter,
  tenantAuditFilter,
} from "../../src/core/identity/platform/audit";
import { isIdentityEnforced } from "../../src/core/identity/auth/config";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function makeRequest(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

function walkTsFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, files);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

const session = { id: "sess-1" };
const operatorUser = {
  status: "active" as const,
  platformRoles: [PLATFORM_ROLE_CODES.OPERATOR],
  email: "someone@example.com",
  isSystemAccount: false,
};
const ownerUser = {
  status: "active" as const,
  platformRoles: [PLATFORM_ROLE_CODES.OWNER],
  email: "someone@example.com",
  isSystemAccount: false,
};

describe("OT-GROWTH-PROD-005 — requirePlatformOperator (capacidad)", () => {
  it("Platform Operator autorizado → acceso permitido", () => {
    const decision = evaluatePlatformOperatorAccess({
      user: operatorUser,
      session,
      membership: null,
      activeTenantId: null,
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, "ok");
    assert.equal(hasPlatformOperatorCapability(ownerUser), true);
  });

  it("super_admin de SEM sin rol global → denegado", () => {
    const user = {
      status: "active" as const,
      platformRoles: [] as string[],
      isSystemAccount: true,
      email: "owner-sem@example.com",
    };
    const decision = evaluatePlatformOperatorAccess({
      user,
      session,
      membership: { tenantId: SEM_TENANT_ID, roleIds: [`role-${SEM_TENANT_ID}-super-admin`] },
      activeTenantId: SEM_TENANT_ID,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "denied");
  });

  it("super_admin de ADL sin rol global → denegado", () => {
    const user = {
      status: "active" as const,
      platformRoles: [] as string[],
      isSystemAccount: true,
      email: "owner-adl@example.com",
    };
    const decision = evaluatePlatformOperatorAccess({
      user,
      session,
      membership: { tenantId: ADL_TENANT_ID, roleIds: [`role-${ADL_TENANT_ID}-super-admin`] },
      activeTenantId: ADL_TENANT_ID,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "denied");
  });

  it("usuario común → denegado", () => {
    const decision = evaluatePlatformOperatorAccess({
      user: { status: "active", platformRoles: [] },
      session,
      membership: { tenantId: SEM_TENANT_ID, roleIds: [`role-${SEM_TENANT_ID}-guest`] },
      activeTenantId: SEM_TENANT_ID,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "denied");
  });

  it("sin sesión → denegado", () => {
    const decision = evaluatePlatformOperatorAccess({
      user: operatorUser,
      session: null,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, "unauthenticated");

    const noUser = evaluatePlatformOperatorAccess({
      user: null,
      session: null,
    });
    assert.equal(noUser.allowed, false);
    assert.equal(noUser.reason, "unauthenticated");
  });

  it("cambiar de Espacio no cambia la capacidad global", () => {
    const inSem = evaluatePlatformOperatorAccess({
      user: operatorUser,
      session: { ...session, tenantId: SEM_TENANT_ID },
      membership: { tenantId: SEM_TENANT_ID },
      activeTenantId: SEM_TENANT_ID,
    });
    const inAdl = evaluatePlatformOperatorAccess({
      user: operatorUser,
      session: { ...session, tenantId: ADL_TENANT_ID },
      membership: { tenantId: ADL_TENANT_ID },
      activeTenantId: ADL_TENANT_ID,
    });
    const withoutSpace = evaluatePlatformOperatorAccess({
      user: operatorUser,
      session: { ...session, tenantId: "" },
      membership: null,
      activeTenantId: "",
    });
    assert.equal(inSem.allowed, true);
    assert.equal(inAdl.allowed, true);
    assert.equal(withoutSpace.allowed, true);
    assert.deepEqual(inSem.platformRoles, inAdl.platformRoles);
  });

  it("isSystemAccount y email no autorizan", () => {
    const user = {
      status: "active" as const,
      isSystemAccount: true,
      email: "ops@example.com",
      platformRoles: [] as string[],
    };
    const byFlag = evaluatePlatformOperatorAccess({
      user,
      session,
    });
    assert.equal(byFlag.allowed, false);

    const codes = readSrc("src/core/identity/platform/capability.ts");
    assert.doesNotMatch(codes, /user\.isSystemAccount/);
    assert.doesNotMatch(codes, /user\.email/);
    assert.doesNotMatch(codes, /roles\/codes/);
    assert.doesNotMatch(codes, /@mentorprime/);
  });
});

describe("OT-GROWTH-PROD-005 — frontera de códigos y legado", () => {
  it("códigos globales distintos de roles de Espacio", () => {
    const spaceCodes: string[] = Object.values(ROLE_CODES);
    assert.equal(spaceCodes.includes(PLATFORM_ROLE_CODES.OWNER), false);
    assert.equal(spaceCodes.includes(PLATFORM_ROLE_CODES.OPERATOR), false);
    assert.equal(PLATFORM_ROLE_CODES.OWNER, "platform_owner");
    assert.equal(PLATFORM_ROLE_CODES.OPERATOR, "platform_operator");
  });

  it("PLATFORM_ROLES legado no se sincroniza y colisiona a propósito", () => {
    assert.ok(PLATFORM_ROLES.some((r) => r.code === ROLE_CODES.SUPER_ADMIN));
    assert.ok(PLATFORM_ROLES.some((r) => r.code === ROLE_CODES.INSTITUTION_ADMIN));
    for (const mode of ["portal", "full"] as const) {
      const synced = getTenantRolesForSync(mode);
      assert.equal(synced.some((r) => r === PLATFORM_ROLES[0]), false);
      assert.equal(
        synced.some((r) => {
          const code = String(r.code);
          return code === PLATFORM_ROLE_CODES.OWNER || code === PLATFORM_ROLE_CODES.OPERATOR;
        }),
        false
      );
    }
    const defaults = readSrc("src/core/identity/roles/defaults.ts");
    assert.match(defaults, /LEGACY — no activar/);
    assert.doesNotMatch(defaults, /getTenantRolesForSync[\s\S]*PLATFORM_ROLES/);
  });

  it("no crea Tenant platform ni recupera IDENTITY_ENFORCE=false", () => {
    assert.equal(isIdentityEnforced(), true);
    const enforce = readSrc("src/core/identity/auth/config.ts");
    assert.match(enforce, /export function isIdentityEnforced/);
    assert.doesNotMatch(enforce, /process\.env\.IDENTITY_ENFORCE/);

    const capability = readSrc("src/core/identity/platform/capability.ts");
    assert.doesNotMatch(capability, /tenantId:\s*["']platform["']/);

    const grant = readSrc("src/lib/identity/platform-roles.ts");
    assert.doesNotMatch(grant, /createMembership/);
    assert.doesNotMatch(grant, /identity_memberships/);

    const script = readSrc("scripts/grant-platform-role.ts");
    assert.doesNotMatch(script, /identity_memberships/);
    assert.doesNotMatch(script, /soporte@mentorprime/);
  });
});

describe("OT-GROWTH-PROD-005 — superficie y guard", () => {
  it("proxy exige sesión en /platform y no en el portal público", () => {
    const denied = proxy(makeRequest(PLATFORM_ADMIN_HOME));
    assert.equal(denied.status, 307);
    assert.equal(new URL(denied.headers.get("location")!).pathname, "/admin/login");
    assert.equal(
      new URL(denied.headers.get("location")!).searchParams.get("next"),
      PLATFORM_ADMIN_HOME
    );

    const allowed = proxy(makeRequest(PLATFORM_ADMIN_HOME, `${SESSION_COOKIE}=sess-test`));
    assert.equal(allowed.status, 200);

    const publicOk = proxy(makeRequest("/"));
    assert.equal(publicOk.status, 200);
  });

  it("requirePlatformOperator no depende del Espacio activo", () => {
    const guard = readSrc("src/core/identity/middleware/guards.ts");
    assert.match(guard, /export async function requirePlatformOperator/);
    const fn = guard.slice(guard.indexOf("export async function requirePlatformOperator"));
    const body = fn.slice(0, fn.indexOf("export async function requireSession"));
    assert.match(body, /evaluatePlatformOperatorAccess/);
    assert.match(body, /requireAuth/);
    assert.doesNotMatch(body, /requireSpace/);
    assert.doesNotMatch(body, /requireOwner/);
    assert.doesNotMatch(body, /isSystemAccount/);
    assert.doesNotMatch(body, /soporte@/);
  });

  it("APIs /api/platform usan requirePlatformOperator", () => {
    const apiDir = resolve(ROOT, "src/app/api/platform");
    const files = walkTsFiles(apiDir);
    assert.ok(files.length > 0, "debe existir al menos una ruta /api/platform");
    for (const file of files) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      assert.match(src, /requirePlatformOperator/, rel);
    }
  });

  it("landing: operador sin Espacio → /platform; owner de cliente → no", () => {
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
        hasSpace: false,
        isPlatformOperator: false,
        next: "/platform",
      }),
      "/admin/sin-espacio"
    );
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
        hasSpace: true,
        isPlatformOperator: true,
        next: "/platform",
      }),
      "/platform"
    );
  });
});

describe("OT-GROWTH-PROD-005 — identity_audit único motor", () => {
  it("acciones globales usan scope platform y no tenantId de cliente", () => {
    assert.deepEqual(platformAuditFilter(), { scope: "platform" });
    assert.deepEqual(tenantAuditFilter(SEM_TENANT_ID), { tenantId: SEM_TENANT_ID });
    assert.equal(isPlatformAuditEntry({ scope: "platform" }), true);
    assert.equal(isPlatformAuditEntry({ tenantId: SEM_TENANT_ID }), false);

    const write = readSrc("src/lib/identity/audit.ts");
    assert.match(write, /scope === "platform"/);
    assert.match(write, /listPlatformAudit/);
    assert.doesNotMatch(write, /platform_audit/);
  });
});
