/**
 * OT-GROWTH-PLATFORM-ADMIN-002 — catálogo y ficha de Espacios (Platform Admin).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  evaluatePlatformOperatorAccess,
  hasPlatformOperatorCapability,
} from "../../src/core/identity/platform/capability";
import { PLATFORM_ROLE_CODES } from "../../src/core/identity/platform/codes";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import {
  ADL_TENANT_ID,
  SEM_TENANT_ID,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import { listTenants } from "../../src/core/tenant/repositories";
import { labelSpaceRole } from "../../src/lib/platform/space-labels";
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

describe("OT-GROWTH-PLATFORM-ADMIN-002 — frontera y APIs", () => {
  it("APIs /api/platform/spaces usan requirePlatformOperator", () => {
    const list = readSrc("src/app/api/platform/spaces/route.ts");
    const detail = readSrc("src/app/api/platform/spaces/[tenantId]/route.ts");
    assert.match(list, /requirePlatformOperator/);
    assert.match(detail, /requirePlatformOperator/);
    assert.doesNotMatch(list, /listAvailableSpacesForUser/);
    assert.doesNotMatch(detail, /listAvailableSpacesForUser/);
    assert.doesNotMatch(list, /\/api\/identity\/spaces/);
    assert.doesNotMatch(detail, /\/api\/identity\/spaces/);
  });

  it("todas las rutas /api/platform siguen bajo requirePlatformOperator", () => {
    const apiDir = resolve(ROOT, "src/app/api/platform");
    const files = walkTsFiles(apiDir);
    assert.ok(files.length >= 3, "debe existir access + spaces + spaces/:id");
    for (const file of files) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      assert.match(src, /requirePlatformOperator/, rel);
    }
  });

  it("catálogo no depende de GET /api/identity/spaces ni del Espacio activo", () => {
    const service = readSrc("src/lib/platform/spaces.ts");
    assert.match(service, /listTenants/);
    assert.match(service, /export async function listPlatformSpaces/);
    assert.match(service, /export async function getPlatformSpaceDetail/);
    assert.doesNotMatch(service, /listAvailableSpacesForUser/);
    assert.doesNotMatch(service, /activeTenantId/);
    assert.doesNotMatch(service, /\/api\/identity\/spaces/);

    const page = readSrc("src/app/platform/page.tsx");
    assert.match(page, /listPlatformSpaces/);
    assert.doesNotMatch(page, /listAvailableSpacesForUser/);
  });

  it("Owner de SEM/ADL sin rol global no pasa el guard de capacidad", () => {
    for (const tenantId of [SEM_TENANT_ID, ADL_TENANT_ID]) {
      const decision = evaluatePlatformOperatorAccess({
        user: {
          status: "active",
          platformRoles: [],
        },
        session: { id: "sess" },
        membership: {
          tenantId,
          roleIds: [`role-${tenantId}-super-admin`],
        },
        activeTenantId: tenantId,
      });
      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, "denied");
    }
    assert.equal(
      hasPlatformOperatorCapability({
        status: "active",
        platformRoles: [PLATFORM_ROLE_CODES.OPERATOR],
      }),
      true
    );
  });

  it("lenguaje visible: Espacio / Sitio / Dueño del Espacio / Growth OS", () => {
    assert.equal(labelSpaceRole(ROLE_CODES.SUPER_ADMIN), "Dueño del Espacio");
    assert.notEqual(labelSpaceRole(ROLE_CODES.SUPER_ADMIN), "super_admin");

    const catalog = readSrc("src/components/platform/PlatformSpacesCatalog.tsx");
    const detail = readSrc("src/components/platform/PlatformSpaceDetailView.tsx");
    const page = readSrc("src/app/platform/page.tsx");
    const shell = readSrc("src/components/platform/PlatformShell.tsx");

    for (const src of [catalog, detail, page, shell]) {
      assert.match(src, /Espacio/);
      assert.doesNotMatch(src, /\bTenant\b/);
      assert.doesNotMatch(src, /super_admin/);
    }
    assert.match(catalog, /Dominio principal/);
    assert.match(catalog, /Ver espacio/);
    assert.match(detail, /Dueño del Espacio/);
    assert.match(page, /Growth OS|PLATFORM_DISPLAY_NAME/);
    assert.match(shell, /PLATFORM_DISPLAY_NAME/);
  });

  it("listTenants existe como lectura global reutilizable", () => {
    const repos = readSrc("src/core/tenant/repositories.ts");
    assert.match(repos, /export async function listTenants/);
    const index = readSrc("src/core/tenant/index.ts");
    assert.match(index, /listTenants/);
  });
});

describe("OT-GROWTH-PLATFORM-ADMIN-002 — aislamiento SEM / ADL", () => {
  it("listTenants ve SEM y ADL cuando están provisionados", async () => {
    await withDb(async (db) => {
      const count = await db.collection(TENANTS_COLLECTION).countDocuments({
        tenantId: { $in: [SEM_TENANT_ID, ADL_TENANT_ID] },
      });
      if (count < 2) {
        console.warn("skip: SEM/ADL no provisionados en esta DB");
        return;
      }
      const tenants = await listTenants(db);
      const ids = new Set(tenants.map((t) => t.tenantId));
      assert.ok(ids.has(SEM_TENANT_ID), "catálogo debe incluir SEM");
      assert.ok(ids.has(ADL_TENANT_ID), "catálogo debe incluir ADL");
    });
  });

  it("dominios y site_config de SEM no se mezclan con ADL", async () => {
    await withDb(async (db) => {
      const { findDomainsByTenantId, findSiteConfigBySiteId, findDefaultSiteForTenant } =
        await import("../../src/core/tenant/repositories");

      const [semDomains, adlDomains, semSite, adlSite] = await Promise.all([
        findDomainsByTenantId(db, SEM_TENANT_ID),
        findDomainsByTenantId(db, ADL_TENANT_ID),
        findDefaultSiteForTenant(db, SEM_TENANT_ID),
        findDefaultSiteForTenant(db, ADL_TENANT_ID),
      ]);

      if (!semSite || !adlSite) {
        console.warn("skip: Sitios SEM/ADL no disponibles");
        return;
      }

      assert.ok(semDomains.every((d) => d.tenantId === SEM_TENANT_ID));
      assert.ok(adlDomains.every((d) => d.tenantId === ADL_TENANT_ID));

      const semHosts = new Set(semDomains.map((d) => d.host));
      for (const domain of adlDomains) {
        assert.equal(
          semHosts.has(domain.host),
          false,
          `host compartido indebido: ${domain.host}`
        );
      }

      const [semConfig, adlConfig] = await Promise.all([
        findSiteConfigBySiteId(db, semSite.siteId),
        findSiteConfigBySiteId(db, adlSite.siteId),
      ]);
      if (semConfig) assert.equal(semConfig.tenantId, SEM_TENANT_ID);
      if (adlConfig) assert.equal(adlConfig.tenantId, ADL_TENANT_ID);
      if (semConfig && adlConfig) {
        assert.notEqual(semConfig.siteId, adlConfig.siteId);
      }

      const service = readSrc("src/lib/platform/spaces.ts");
      assert.match(service, /domain\.tenantId === tenant\.tenantId/);
      assert.match(service, /membership\.tenantId === tenant\.tenantId/);
      assert.match(service, /siteConfig\.tenantId === tenant\.tenantId/);
    });
  });
});
