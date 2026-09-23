/**
 * Subdominio de plataforma homologado por Espacio.
 * `{slug}.localhost:{puerto}` en local; `{slug}.{PLATFORM_BASE_DOMAIN}` en prod.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import { createPlatformSpace } from "../../src/core/tenant/create-platform-space";
import { homologateSitePlatformDomain } from "../../src/core/tenant/homologate-domains";
import { ensureDomainIndexes } from "../../src/core/tenant/domains";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "../../src/core/tenant/types";

const FIX = "tenant-defdom";

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

async function withDb(
  t: { skip: (msg?: string) => void },
  run: (db: Db) => Promise<void>
): Promise<void> {
  loadTestMongoEnv();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    t.skip("Sin MONGODB_URI/MONGODB_DB");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
  } catch (error) {
    await client.close().catch(() => undefined);
    t.skip(
      `Mongo no disponible: ${error instanceof Error ? error.message : String(error)}`
    );
    return;
  }
  try {
    await run(client.db(dbName));
  } finally {
    await client.close();
  }
}

async function cleanup(db: Db, tenantId: string): Promise<void> {
  await db.collection(DOMAINS_COLLECTION).deleteMany({ tenantId });
  await db.collection("site_config").deleteMany({ tenantId });
  await db.collection(SITES_COLLECTION).deleteMany({ tenantId });
  await db.collection(TENANTS_COLLECTION).deleteMany({ tenantId });
  await db.collection("cms_menus").deleteMany({ tenant: tenantId });
  await db.collection("cms_pages").deleteMany({ tenant: tenantId });
  await db.collection("identity_roles").deleteMany({ tenantId });
  await db.collection("platform_integrations").deleteMany({ tenantId });
}

describe("subdominio de plataforma homologado", () => {
  it("migración 025 está registrada", () => {
    const registry = readFileSync(
      resolve(process.cwd(), "src/core/migrations/registry.ts"),
      "utf8"
    );
    assert.match(registry, /025-platform-default-domains/);
    assert.match(registry, /migration025PlatformDefaultDomains/);
  });

  it("SEM con localhost pelado pasa el primario al subdominio del Espacio", async (t) => {
    await withDb(t, async (db) => {
      await ensureDomainIndexes(db);
      const suffix = Date.now();
      const tenantId = `${FIX}-semlike-${suffix}`;
      const siteId = tenantId;
      const loopHost = `localhost:${4000 + (suffix % 1000)}`;
      const platformHost = `${siteId}.localhost:3000`;
      const at = new Date().toISOString();
      const base = createDefaultSiteConfig();

      try {
        await db.collection<TenantDocument>(TENANTS_COLLECTION).insertOne({
          _id: tenantId,
          tenantId,
          code: "T-DEFDOM",
          name: "Fixture homologate",
          slug: siteId,
          status: "active",
          type: "institution",
          defaultSiteId: siteId,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteDocument>(SITES_COLLECTION).insertOne({
          _id: siteId,
          siteId,
          tenantId,
          code: "S-DEFDOM",
          name: "Fixture",
          slug: siteId,
          status: "active",
          isDefault: true,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteConfigDocument>("site_config").insertOne({
          _id: siteId,
          tenantId,
          siteId,
          schemaVersion: base.schemaVersion,
          modules: base.modules,
          institution: { ...base.institution, tenant: tenantId },
          branding: base.branding,
          seo: base.seo,
          contact: base.contact,
          social: base.social,
          features: base.features,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<DomainDocument>(DOMAINS_COLLECTION).insertOne({
          _id: loopHost,
          host: loopHost,
          tenantId,
          siteId,
          isPrimary: true,
          kind: "legacy",
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<DomainDocument>(DOMAINS_COLLECTION).insertOne({
          _id: platformHost,
          host: platformHost,
          tenantId,
          siteId,
          isPrimary: false,
          kind: "legacy",
          createdAt: at,
          updatedAt: at,
        });

        const result = await homologateSitePlatformDomain(db, {
          siteId,
          tenantId,
          slug: siteId,
        });

        assert.deepEqual(result.removed, [loopHost]);
        assert.ok(result.relabeled.includes(platformHost));
        assert.equal(result.primaryHost, platformHost);

        const leftover = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ _id: loopHost });
        assert.equal(leftover, null);

        const primary = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ siteId, isPrimary: true });
        assert.equal(primary?.host, platformHost);
        assert.equal(primary?.kind, "platform_subdomain");
      } finally {
        await cleanup(db, tenantId);
        await db.collection(DOMAINS_COLLECTION).deleteOne({ _id: loopHost });
      }
    });
  });

  it("conserva un dominio propio ya primario y deja el subdominio como alias", async (t) => {
    await withDb(t, async (db) => {
      await ensureDomainIndexes(db);
      const suffix = Date.now();
      const tenantId = `${FIX}-custom-${suffix}`;
      const siteId = tenantId;
      const customHost = `www-${suffix}.cliente.test`;
      const platformHost = `${siteId}.localhost:3000`;
      const at = new Date().toISOString();
      const base = createDefaultSiteConfig();

      try {
        await db.collection<TenantDocument>(TENANTS_COLLECTION).insertOne({
          _id: tenantId,
          tenantId,
          code: "T-DEFDOM-C",
          name: "Fixture custom",
          slug: siteId,
          status: "active",
          type: "business",
          defaultSiteId: siteId,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteDocument>(SITES_COLLECTION).insertOne({
          _id: siteId,
          siteId,
          tenantId,
          code: "S-DEFDOM-C",
          name: "Fixture custom",
          slug: siteId,
          status: "active",
          isDefault: true,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteConfigDocument>("site_config").insertOne({
          _id: siteId,
          tenantId,
          siteId,
          schemaVersion: base.schemaVersion,
          modules: base.modules,
          institution: { ...base.institution, tenant: tenantId },
          branding: base.branding,
          seo: base.seo,
          contact: base.contact,
          social: base.social,
          features: base.features,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<DomainDocument>(DOMAINS_COLLECTION).insertOne({
          _id: customHost,
          host: customHost,
          tenantId,
          siteId,
          isPrimary: true,
          kind: "custom",
          createdAt: at,
          updatedAt: at,
        });

        const result = await homologateSitePlatformDomain(db, {
          siteId,
          tenantId,
          slug: siteId,
        });

        assert.equal(result.created, true);
        assert.equal(result.primaryHost, customHost);

        const platform = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ _id: platformHost });
        assert.equal(platform?.kind, "platform_subdomain");
        assert.equal(platform?.isPrimary, false);

        const primary = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ siteId, isPrimary: true });
        assert.equal(primary?.host, customHost);
      } finally {
        await cleanup(db, tenantId);
      }
    });
  });

  it("crear Espacio registra el subdominio como platform_subdomain", async (t) => {
    await withDb(t, async (db) => {
      const slug = `ot-defdom-${Date.now().toString(36)}`;
      try {
        const created = await createPlatformSpace(
          db,
          {
            name: "Espacio homologado",
            slug,
            type: "other",
            host: "",
          },
          "actor-defdom"
        );
        assert.equal(created.primaryDomain, `${slug}.localhost:3000`);

        const domain = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ host: `${slug}.localhost:3000` });
        assert.equal(domain?.kind, "platform_subdomain");
        assert.equal(domain?.isPrimary, true);
      } finally {
        await cleanup(db, slug);
      }
    });
  });
});
