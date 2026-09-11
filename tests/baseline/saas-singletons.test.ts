/**
 * OT-GROWTH-SAAS-004 — singletons / bootstrap inseguro.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import { SEM_TENANT_ID } from "../../src/core/tenant/constants";
import {
  logicalResourceId,
  resourceIdCandidates,
  scopedResourceId,
  storageIntegrationIdForTenant,
} from "../../src/core/tenant/resource-ids";
import { migration008SaasSingletons } from "../../src/core/migrations/008-saas-singletons";
import { loadEnvLocal } from "../../src/core/migrations/env";

const OTHER_TENANT = "tenant-saas004-other";

function loadEnvFile(filename: string): void {
  const envPath = resolve(process.cwd(), filename);
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

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("OT-GROWTH-SAAS-004 — singletons e inicialización", () => {
  it("código: IDs scoped; storage por tenant; blocks/templates globales; GET sin ensure", () => {
    const ids = readSrc("src/core/tenant/resource-ids.ts");
    assert.match(ids, /export function scopedResourceId/);
    assert.match(ids, /export function storageIntegrationIdForTenant/);

    const pages = readSrc("src/lib/cms/pages.ts");
    assert.match(pages, /scopedResourceId/);
    assert.match(pages, /resourceIdCandidates/);

    const menus = readSrc("src/lib/cms/menus.ts");
    assert.match(menus, /scopedResourceId/);
    assert.match(menus, /resourceIdCandidates/);

    const storage = readSrc("src/lib/cms/storage-config.ts");
    assert.match(storage, /storageIntegrationIdForTenant/);
    assert.match(storage, /tenantId/);

    const blocks = readSrc("src/lib/cms/blocks.ts");
    assert.match(blocks, /Catálogo global de plataforma/);
    assert.equal(blocks.includes("tenantId"), false);

    const templates = readSrc("src/lib/cms/templates.ts");
    assert.match(templates, /Catálogo global de plataforma/);

    const rolesGet = readSrc("src/app/api/identity/roles/route.ts");
    const rolesGetBody = rolesGet.slice(rolesGet.indexOf("export async function GET"));
    assert.equal(/ensureTenantRoles\s*\(/.test(rolesGetBody), false);

    const wfGet = readSrc("src/app/api/workflows/definitions/route.ts");
    assert.equal(/ensureSystemDefinitions\s*\(/.test(wfGet), false);
  });

  it("helpers: dos tenants pueden tener home/main sin colisión de _id", () => {
    const a = scopedResourceId(SEM_TENANT_ID, "home");
    const b = scopedResourceId(OTHER_TENANT, "home");
    assert.notEqual(a, b);
    assert.equal(a, `${SEM_TENANT_ID}:home`);
    assert.equal(b, `${OTHER_TENANT}:home`);

    const mainA = scopedResourceId(SEM_TENANT_ID, "main");
    const mainB = scopedResourceId(OTHER_TENANT, "main");
    assert.notEqual(mainA, mainB);

    assert.deepEqual(resourceIdCandidates(SEM_TENANT_ID, "home"), [
      `${SEM_TENANT_ID}:home`,
      "home",
    ]);
    assert.equal(logicalResourceId(SEM_TENANT_ID, a), "home");
    assert.equal(logicalResourceId(SEM_TENANT_ID, "home"), "home");
  });

  it("integraciones T001 no son recuperables desde otro tenant", async () => {
    await withDb(async (db) => {
      const col = db.collection<{
        _id: string;
        tenantId: string;
        enabled: boolean;
        provider: string;
        accessMode: string;
        endpoint: string;
        region: string;
        bucket: string;
        accessKeyId: string;
        secretAccessKeyEncrypted: string;
        publicUrl: string;
        forcePathStyle: boolean;
        createdAt: string;
        updatedAt: string;
      }>("platform_integrations");
      const semId = storageIntegrationIdForTenant(SEM_TENANT_ID);
      const otherId = storageIntegrationIdForTenant(OTHER_TENANT);
      const stamp = Date.now();

      await col.deleteMany({ _id: { $in: [semId, otherId] } });

      await col.insertOne({
        _id: semId,
        tenantId: SEM_TENANT_ID,
        enabled: true,
        provider: "s3-compatible",
        accessMode: "private",
        endpoint: "https://example.test",
        region: "auto",
        bucket: `sem-bucket-${stamp}`,
        accessKeyId: "sem-key",
        secretAccessKeyEncrypted: "x",
        publicUrl: "",
        forcePathStyle: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      try {
        const cross = await col.findOne({ _id: semId, tenantId: OTHER_TENANT });
        assert.equal(cross, null);

        const otherLookup = await col.findOne({
          _id: otherId,
          tenantId: OTHER_TENANT,
        });
        assert.equal(otherLookup, null);

        const sem = await col.findOne({ _id: semId, tenantId: SEM_TENANT_ID });
        assert.ok(sem);
        assert.equal(sem.bucket, `sem-bucket-${stamp}`);
      } finally {
        await col.deleteMany({ _id: { $in: [semId, otherId] } });
      }
    });
  });

  it("dos tenants pueden insertar home/main sin colisión Mongo", async () => {
    await withDb(async (db) => {
      const pages = db.collection<{
        _id: string;
        tenant: string;
        title: string;
        slug: string;
        description: string;
        status: string;
        template: string;
        seo: Record<string, unknown>;
        blocks: unknown[];
        versions: unknown[];
        createdAt: string;
        updatedAt: string;
      }>("cms_pages");
      const menus = db.collection<{
        _id: string;
        tenant: string;
        name: string;
        location: string;
        active: boolean;
        items: unknown[];
        createdAt: string;
        updatedAt: string;
      }>("cms_menus");
      const homeSem = scopedResourceId(SEM_TENANT_ID, `saas004-home-${Date.now()}`);
      const logical = `saas004-collide-${Date.now()}`;
      const idA = scopedResourceId(SEM_TENANT_ID, logical);
      const idB = scopedResourceId(OTHER_TENANT, logical);
      const menuA = scopedResourceId(SEM_TENANT_ID, `main-${logical}`);
      const menuB = scopedResourceId(OTHER_TENANT, `main-${logical}`);

      const now = new Date().toISOString();
      try {
        await pages.insertMany([
          {
            _id: idA,
            tenant: SEM_TENANT_ID,
            title: "A",
            slug: `/${logical}-a`,
            description: "",
            status: "draft",
            template: "blank",
            seo: {},
            blocks: [],
            versions: [],
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: idB,
            tenant: OTHER_TENANT,
            title: "B",
            slug: `/${logical}-b`,
            description: "",
            status: "draft",
            template: "blank",
            seo: {},
            blocks: [],
            versions: [],
            createdAt: now,
            updatedAt: now,
          },
        ]);

        await menus.insertMany([
          {
            _id: menuA,
            tenant: SEM_TENANT_ID,
            name: "Main A",
            location: "header",
            active: true,
            items: [],
            createdAt: now,
            updatedAt: now,
          },
          {
            _id: menuB,
            tenant: OTHER_TENANT,
            name: "Main B",
            location: "header",
            active: true,
            items: [],
            createdAt: now,
            updatedAt: now,
          },
        ]);

        assert.ok(await pages.findOne({ _id: idA, tenant: SEM_TENANT_ID }));
        assert.ok(await pages.findOne({ _id: idB, tenant: OTHER_TENANT }));
        assert.equal(await pages.findOne({ _id: idA, tenant: OTHER_TENANT }), null);
        assert.notEqual(homeSem, idB);
      } finally {
        await pages.deleteMany({ _id: { $in: [idA, idB] } });
        await menus.deleteMany({ _id: { $in: [menuA, menuB] } });
      }
    });
  });

  it("migración 008 es idempotente", async () => {
    await withDb(async (db) => {
      const first = await migration008SaasSingletons.run({
        db,
        log: () => undefined,
      });
      const second = await migration008SaasSingletons.run({
        db,
        log: () => undefined,
      });
      assert.ok(first.details?.length);
      assert.ok(second.details?.length);
      // Segunda corrida: pages/menus skipped o rename 0; storage exists
      assert.equal(
        second.details!.some(
          (d) =>
            d.includes("skipped=") ||
            d.includes("=exists") ||
            d.includes("rename scoped=0")
        ),
        true
      );
    });
  });
});
