/**
 * OT-GROWTH-PLATFORM-ADMIN-004 — Entrar a Espacio (Platform Admin V1 cierre).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import type { IdentityMembership, IdentityRole, IdentityUser } from "../../src/types/identity";
import {
  evaluatePlatformOperatorAccess,
  hasPlatformOperatorCapability,
} from "../../src/core/identity/platform/capability";
import { PLATFORM_ROLE_CODES } from "../../src/core/identity/platform/codes";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { roleIdForTenant } from "../../src/core/identity/roles/defaults";
import {
  ADL_TENANT_ID,
  SEM_TENANT_ID,
} from "../../src/core/tenant/constants";
import { SPACE_ACCESS_REQUIRED_MESSAGE } from "../../src/core/identity/platform/enter-messages";
import {
  grantOperatorSpaceAccess,
  operatorHasActiveSpaceAccess,
  PlatformEnterSpaceError,
} from "../../src/core/identity/platform/grant-space-access";
import { loadEnvLocal } from "../../src/core/migrations/env";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
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

function loadEnvFile(filename: string): void {
  const envPath = resolve(ROOT, filename);
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadTestMongoEnv(): void {
  loadEnvLocal();
  loadEnvFile(".env");
}

async function withDb(run: (db: Db) => Promise<void>): Promise<void> {
  loadTestMongoEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    console.warn("skip: MONGODB_URI/MONGODB_DB no configurados");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  try {
    await run(client.db(dbName));
  } finally {
    await client.close();
  }
}

describe("OT-GROWTH-PLATFORM-ADMIN-004 — contrato y frontera", () => {
  it("UI Entrar al Espacio reutiliza switch y mensaje claro sin membresía", () => {
    const panel = readSrc("src/components/platform/PlatformEnterSpacePanel.tsx");
    const detail = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    assert.match(panel, /Entrar al Espacio/);
    assert.match(panel, /\/api\/identity\/spaces\/switch/);
    assert.match(panel, /SPACE_ACCESS_REQUIRED_MESSAGE|Necesitas acceso a este Espacio para entrar/);
    assert.match(panel, /Crear acceso de Soporte/);
    assert.match(panel, /window\.location\.assign/);
    assert.match(panel, /\/admin/);
    assert.doesNotMatch(panel, /\?tenant=/);
    assert.doesNotMatch(panel, /impersonat|modo dios|god mode/i);
    assert.doesNotMatch(panel, /x-tenant|X-Tenant/i);
    assert.match(detail, /PlatformEnterSpacePanel/);
  });

  it("access API bajo requirePlatformOperator; grant usa support, nunca super_admin", () => {
    const route = readSrc(
      "src/app/api/platform/spaces/[tenantId]/access/route.ts"
    );
    const service = readSrc("src/core/identity/platform/grant-space-access.ts");
    const lib = readSrc("src/lib/platform/enter-space.ts");
    assert.match(route, /requirePlatformOperator/);
    assert.match(route, /grantOperatorSpaceAccess/);
    assert.match(lib, /grantOperatorSpaceAccess/);
    assert.match(service, /ROLE_CODES\.SUPPORT/);
    assert.match(service, /identity_memberships/);
    assert.match(service, /platform\.space\.access\.grant/);
    assert.match(service, /scope:\s*"platform"/);
    assert.match(service, /neverOwner/);
    assert.doesNotMatch(service, /ensureSuperAdminMembership/);
    assert.doesNotMatch(
      service,
      /roleIds:\s*\[[^\]]*ROLE_CODES\.SUPER_ADMIN/
    );
    assert.doesNotMatch(service, /impersonat/i);
    assert.doesNotMatch(service, /\?tenant=/);
  });

  it("switch sigue exigiendo membresía activa (sin spoof)", () => {
    const switchRoute = readSrc("src/app/api/identity/spaces/switch/route.ts");
    assert.match(switchRoute, /assertActiveMembership/);
    assert.match(switchRoute, /updateSessionActiveTenant/);
    assert.match(switchRoute, /space\.switch/);
    assert.doesNotMatch(switchRoute, /requirePlatformOperator/);
    assert.doesNotMatch(switchRoute, /platform_owner|platform_operator/);
  });

  it("admin SEM sin rol global no pasa capacidad Platform Admin", () => {
    const decision = evaluatePlatformOperatorAccess({
      user: { status: "active", platformRoles: [] },
      session: { id: "sess" },
      membership: {
        tenantId: SEM_TENANT_ID,
        roleIds: [`role-${SEM_TENANT_ID}-super-admin`],
      },
      activeTenantId: SEM_TENANT_ID,
    });
    assert.equal(decision.allowed, false);
    assert.equal(
      hasPlatformOperatorCapability({
        status: "active",
        platformRoles: [PLATFORM_ROLE_CODES.OPERATOR],
      }),
      true
    );
  });

  it("mensaje de acceso requerido es el contrato UX", () => {
    assert.equal(
      SPACE_ACCESS_REQUIRED_MESSAGE,
      "Necesitas acceso a este Espacio para entrar."
    );
  });

  it("todas las rutas /api/platform siguen bajo requirePlatformOperator", () => {
    const apiDir = resolve(ROOT, "src/app/api/platform");
    const files = walkTsFiles(apiDir);
    assert.ok(files.length >= 4, "access + spaces + spaces/:id + spaces/:id/access");
    for (const file of files) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      assert.match(src, /requirePlatformOperator/, rel);
    }
  });

  it("no introduce platform_owner como permiso interno del cliente", () => {
    const service = readSrc("src/core/identity/platform/grant-space-access.ts");
    const panel = readSrc("src/components/platform/PlatformEnterSpacePanel.tsx");
    assert.doesNotMatch(service, /platform_owner|PLATFORM_ROLE/);
    assert.doesNotMatch(panel, /platform_owner|PLATFORM_ROLE/);
  });
});

describe("OT-GROWTH-PLATFORM-ADMIN-004 — membresía acotada Mongo", () => {
  it("crea acceso support sin Owner; operador sin membresía no tiene acceso activo", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const userId = `usr-pa4-${stamp}`;
      const tenantId = SEM_TENANT_ID;

      // Asegurar rol support del Espacio SEM.
      const supportId = roleIdForTenant(tenantId, ROLE_CODES.SUPPORT);
      const ownerId = roleIdForTenant(tenantId, ROLE_CODES.SUPER_ADMIN);
      await db.collection<IdentityRole>("identity_roles").updateOne(
        { _id: supportId },
        {
          $setOnInsert: {
            _id: supportId,
            tenantId,
            code: ROLE_CODES.SUPPORT,
            name: "Support",
            description: "Soporte",
            permissionIds: [],
            system: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      await db.collection<IdentityUser>("identity_users").deleteMany({ _id: userId });
      await db.collection<IdentityMembership>("identity_memberships").deleteMany({
        userId,
        tenantId,
      });
      await db.collection("identity_audit").deleteMany({
        userId,
        action: "platform.space.access.grant",
      });

      try {
        assert.equal(
          await operatorHasActiveSpaceAccess(db, userId, tenantId),
          false
        );

        const granted = await grantOperatorSpaceAccess(db, {
          tenantId,
          operatorUserId: userId,
        });

        assert.equal(granted.created, true);
        assert.equal(granted.roleCode, ROLE_CODES.SUPPORT);
        assert.equal(
          await operatorHasActiveSpaceAccess(db, userId, tenantId),
          true
        );

        const membership = await db
          .collection<IdentityMembership>("identity_memberships")
          .findOne({ _id: granted.membershipId });
        assert.ok(membership);
        assert.equal(membership!.tenantId, tenantId);
        assert.equal(membership!.userId, userId);
        assert.equal(membership!.status, "active");
        assert.deepEqual(membership!.roleIds, [supportId]);
        assert.ok(!membership!.roleIds.includes(ownerId));

        // Idempotente: no crea segunda membresía ni Owner.
        const again = await grantOperatorSpaceAccess(db, {
          tenantId,
          operatorUserId: userId,
        });
        assert.equal(again.created, false);
        assert.equal(again.membershipId, granted.membershipId);

        const audit = await db.collection("identity_audit").findOne({
          userId,
          action: "platform.space.access.grant",
          scope: "platform",
        });
        assert.ok(audit);
        assert.equal(audit!.metadata?.roleCode, ROLE_CODES.SUPPORT);
        assert.equal(audit!.metadata?.neverOwner, true);
        assert.equal(audit!.metadata?.tenantId, tenantId);

        // Aislamiento: membresía SEM no implica acceso ADL.
        assert.equal(
          await operatorHasActiveSpaceAccess(db, userId, ADL_TENANT_ID),
          false
        );

        await assert.rejects(
          () =>
            grantOperatorSpaceAccess(db, {
              tenantId: "espacio-inexistente-pa4",
              operatorUserId: userId,
            }),
          (err: unknown) =>
            err instanceof PlatformEnterSpaceError &&
            err.code === "space_not_found"
        );
      } finally {
        await db.collection<IdentityMembership>("identity_memberships").deleteMany({
          userId,
          tenantId,
        });
        await db.collection<IdentityUser>("identity_users").deleteMany({ _id: userId });
        await db.collection("identity_audit").deleteMany({
          userId,
          action: "platform.space.access.grant",
        });
      }
    });
  });
});
