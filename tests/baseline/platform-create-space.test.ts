/**
 * OT-GROWTH-PLATFORM-ADMIN-003 — Crear Espacio desde Platform Admin.
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
  SITE_CONFIG_COLLECTION,
  TENANTS_COLLECTION,
  DOMAINS_COLLECTION,
  SITES_COLLECTION,
} from "../../src/core/tenant/constants";
import {
  CreatePlatformSpaceError,
  createPlatformSpace,
  normalizeSpaceSlug,
} from "../../src/core/tenant/create-platform-space";
import { listTenants } from "../../src/core/tenant/repositories";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { roleIdForTenant } from "../../src/core/identity/roles/defaults";

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
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12_000 });
  await client.connect();
  try {
    await run(client.db(dbName));
  } finally {
    await client.close();
  }
}

async function cleanupSpace(db: Db, slug: string): Promise<void> {
  assert.notEqual(slug, SEM_TENANT_ID);
  assert.notEqual(slug, ADL_TENANT_ID);
  await db.collection(TENANTS_COLLECTION).deleteMany({ tenantId: slug });
  await db.collection(SITES_COLLECTION).deleteMany({ tenantId: slug });
  await db.collection(DOMAINS_COLLECTION).deleteMany({ tenantId: slug });
  await db.collection(SITE_CONFIG_COLLECTION).deleteMany({ tenantId: slug });
  await db.collection("cms_menus").deleteMany({ tenant: slug });
  await db.collection("cms_pages").deleteMany({ tenant: slug });
  await db.collection("identity_roles").deleteMany({ tenantId: slug });
  await db.collection("identity_memberships").deleteMany({ tenantId: slug });
  await db.collection("platform_integrations").deleteMany({ tenantId: slug });
}

describe("OT-GROWTH-PLATFORM-ADMIN-003 — contrato y frontera", () => {
  it("POST /api/platform/spaces usa requirePlatformOperator y createPlatformSpace", () => {
    const route = readSrc("src/app/api/platform/spaces/route.ts");
    assert.match(route, /export async function POST/);
    assert.match(route, /requirePlatformOperator/);
    assert.match(route, /createPlatformSpace/);
    assert.doesNotMatch(route, /ensureAdlTenantFoundation|ensureSemTenantFoundation/);
  });

  it("createPlatformSpace reutiliza provisionTenantFoundation sin motor paralelo", () => {
    const service = readSrc("src/core/tenant/create-platform-space.ts");
    assert.match(service, /provisionTenantFoundation/);
    assert.match(service, /createDefaultSiteConfig/);
    assert.doesNotMatch(service, /ensureAdlTenantFoundation|ensureSemTenantFoundation/);
    assert.doesNotMatch(service, /applySemSiteIdentity|applyAdlSiteIdentity/);
    assert.doesNotMatch(service, /mentorprime|Mentor Prime|seminario-ipn|ADL_TENANT/i);
    assert.match(service, /scope:\s*"platform"/);
    assert.match(service, /platform\.space\.create/);
  });

  it("UI Crear Espacio con resumen nombre / Sitio / dominio / estado", () => {
    const panel = readSrc("src/components/platform/PlatformCreateSpacePanel.tsx");
    const catalog = readSrc("src/components/platform/PlatformSpacesCatalog.tsx");
    const page = readSrc("src/app/platform/page.tsx");
    assert.match(panel, /Crear Espacio/);
    assert.match(panel, /Espacio creado/);
    assert.match(panel, /Nombre/);
    assert.match(panel, /Sitio/);
    assert.match(panel, /Dominio/);
    assert.match(panel, /Estado/);
    assert.match(catalog, /PlatformCreateSpacePanel/);
    assert.match(page, /PlatformSpacesCatalog/);
    assert.doesNotMatch(panel, /\bTenant\b/);
  });

  it("admin de SEM sin rol global sigue denegado", () => {
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

  it("normalizeSpaceSlug valida formato", () => {
    assert.equal(normalizeSpaceSlug("Acme-Demo"), "acme-demo");
    assert.equal(normalizeSpaceSlug("Mentor Capacitación"), "mentor-capacitacion");
    assert.equal(normalizeSpaceSlug("a"), null);
    assert.equal(normalizeSpaceSlug(""), null);
    assert.equal(normalizeSpaceSlug("---"), null);
  });

  it("rutas /api/platform siguen bajo requirePlatformOperator", () => {
    const apiDir = resolve(ROOT, "src/app/api/platform");
    const files = walkTsFiles(apiDir);
    assert.ok(files.length >= 3);
    for (const file of files) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      assert.match(src, /requirePlatformOperator/, rel);
    }
  });
});

describe("OT-GROWTH-PLATFORM-ADMIN-003 — provisión Mongo", () => {
  it("crea Espacio válido, rechaza slug/host duplicados y no siembra SEM ni Owner automático", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const slug = `ot-pa3-${stamp}`;
      const host = `${slug}.localhost:3000`;
      const actorUserId = `actor-platform-${stamp}`;

      const created = await createPlatformSpace(
        db,
        {
          name: `Espacio Prueba ${stamp}`,
          slug,
          type: "academy",
          host,
          siteName: `Sitio ${stamp}`,
          ownerEmail: null,
        },
        actorUserId
      );

      assert.equal(created.tenantId, slug);
      assert.equal(created.created, true);
      assert.equal(created.ownerAssigned, false);
      assert.equal(created.primaryDomain, host);

      const tenant = await db.collection(TENANTS_COLLECTION).findOne({ tenantId: slug });
      assert.ok(tenant);
      assert.equal(tenant?.slug, slug);

      const siteConfig = await db.collection(SITE_CONFIG_COLLECTION).findOne({
        tenantId: slug,
      });
      assert.ok(siteConfig);
      const institution = siteConfig?.institution as Record<string, unknown> | undefined;
      const blob = JSON.stringify(siteConfig).toLowerCase();
      assert.equal(blob.includes("seminario"), false);
      assert.equal(blob.includes("ipn"), false);
      assert.equal(blob.includes("mentorprime"), false);
      assert.equal(institution?.name, `Espacio Prueba ${stamp}`);
      assert.equal(institution?.shortName, `Sitio ${stamp}`);

      const memberships = await db
        .collection("identity_memberships")
        .find({ tenantId: slug })
        .toArray();
      assert.equal(memberships.length, 0);

      const ownerRole = await db.collection("identity_roles").findOne({
        tenantId: slug,
        code: ROLE_CODES.SUPER_ADMIN,
      });
      assert.ok(ownerRole, "roles de portal provisionados");
      assert.equal(ownerRole?._id, roleIdForTenant(slug, ROLE_CODES.SUPER_ADMIN));

      let slugError: unknown;
      try {
        await createPlatformSpace(
          db,
          {
            name: "Otro",
            slug,
            type: "institution",
            host: `other-${stamp}.localhost:3000`,
            siteName: "Otro Sitio",
          },
          actorUserId
        );
      } catch (error) {
        slugError = error;
      }
      assert.ok(slugError instanceof CreatePlatformSpaceError);
      assert.equal((slugError as CreatePlatformSpaceError).code, "slug_taken");

      let hostError: unknown;
      try {
        await createPlatformSpace(
          db,
          {
            name: `Otro Host ${stamp}`,
            slug: `ot-pa3-host-${stamp}`,
            type: "institution",
            host,
            siteName: "Sitio Host",
          },
          actorUserId
        );
      } catch (error) {
        hostError = error;
      }
      assert.ok(hostError instanceof CreatePlatformSpaceError);
      assert.equal((hostError as CreatePlatformSpaceError).code, "host_taken");

      const catalog = await listTenants(db);
      assert.ok(catalog.some((space) => space.tenantId === slug));

      const audits = await db
        .collection("identity_audit")
        .find({
          scope: "platform",
          action: "platform.space.create",
          entityId: slug,
        })
        .toArray();
      assert.ok(audits.length >= 1);

      await cleanupSpace(db, slug);
    });
  });

  it("replay idempotente mismo slug+host no falla ni asigna Owner al operador", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const slug = `ot-pa3-idemp-${stamp}`;
      const host = `${slug}.localhost:3000`;
      const actorUserId = `actor-idemp-${stamp}`;

      const first = await createPlatformSpace(
        db,
        {
          name: `Idemp ${stamp}`,
          slug,
          type: "institution",
          host,
          siteName: `Sitio Idemp ${stamp}`,
        },
        actorUserId
      );
      assert.equal(first.created, true);

      const second = await createPlatformSpace(
        db,
        {
          name: `Idemp ${stamp}`,
          slug,
          type: "institution",
          host,
          siteName: `Sitio Idemp ${stamp}`,
        },
        actorUserId
      );
      assert.equal(second.created, false);
      assert.equal(second.ownerAssigned, false);

      const memberships = await db
        .collection("identity_memberships")
        .find({ tenantId: slug })
        .toArray();
      assert.equal(memberships.length, 0);

      await cleanupSpace(db, slug);
    });
  });
});
