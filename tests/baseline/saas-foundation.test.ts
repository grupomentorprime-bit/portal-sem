import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MongoClient, type Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SEM_SITE_CODE,
  SEM_SITE_ID,
  SEM_TENANT_CODE,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import {
  extractHostsFromAppUrls,
  resolveAppHostsFromEnv,
} from "../../src/core/tenant/hosts";
import {
  buildDomainDocument,
  buildSemSiteDocument,
  buildSemTenantDocument,
  buildSiteConfigDocument,
  ensureSemTenantFoundation,
} from "../../src/core/tenant/migrate-sem";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "../../src/core/tenant/types";
import { migration006SaasFoundation } from "../../src/core/migrations/006-saas-foundation";
import { SITE_CONFIG_ID, type SiteConfig } from "../../src/types/cms";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function sampleSemConfig(): SiteConfig {
  const base = createDefaultSiteConfig();
  return {
    ...base,
    institution: {
      ...base.institution,
      name: "Seminario Eclesiástico Mayor",
      shortName: "SEM",
      tenant: SEM_TENANT_ID,
      organization: "IPN",
      website: "https://seminarioipn.cl",
      status: "active",
    },
    branding: {
      ...base.branding,
      primaryColor: "#1a365d",
      secondaryColor: "#c4a35a",
    },
    seo: {
      ...base.seo,
      title: "SEM — Portal",
      description: "Portal institucional SEM",
    },
  };
}

describe("OT-GROWTH-SAAS-001 — constantes y helpers", () => {
  it("SEM queda fijado como T001 / S001", () => {
    assert.equal(SEM_TENANT_ID, "seminario-ipn");
    assert.equal(SEM_TENANT_CODE, "T001");
    assert.equal(SEM_SITE_ID, "seminario-ipn");
    assert.equal(SEM_SITE_CODE, "S001");
  });

  it("extractHostsFromAppUrls normaliza host+puerto", () => {
    assert.deepEqual(
      extractHostsFromAppUrls([
        "http://localhost:3000",
        "https://seminarioipn.cl/",
        "http://localhost:3000",
        undefined,
      ]),
      ["localhost:3000", "seminarioipn.cl"]
    );
  });

  it("resolveAppHostsFromEnv cae a localhost:3000 si no hay URL", () => {
    assert.deepEqual(
      resolveAppHostsFromEnv({ NODE_ENV: "test" } as NodeJS.ProcessEnv),
      ["localhost:3000"]
    );
  });

  it("builders producen IDs estables sin inventar segundo tenant", () => {
    const config = sampleSemConfig();
    const at = "2026-09-03T00:00:00.000Z";
    const tenant = buildSemTenantDocument(config, null, at);
    const site = buildSemSiteDocument(config, null, at);
    const domain = buildDomainDocument("localhost:3000", true, null, at);
    const siteConfig = buildSiteConfigDocument(config, null, at);

    assert.equal(tenant._id, SEM_TENANT_ID);
    assert.equal(tenant.code, SEM_TENANT_CODE);
    assert.equal(site._id, SEM_SITE_ID);
    assert.equal(site.code, SEM_SITE_CODE);
    assert.equal(site.tenantId, SEM_TENANT_ID);
    assert.equal(domain.tenantId, SEM_TENANT_ID);
    assert.equal(domain.siteId, SEM_SITE_ID);
    assert.equal(domain.kind, "legacy");
    assert.equal(siteConfig._id, SEM_SITE_ID);
    assert.equal(siteConfig.legacyConfigId, SITE_CONFIG_ID);
    assert.equal(
      (siteConfig.institution as { tenant: string }).tenant,
      SEM_TENANT_ID
    );
  });
});

describe("OT-GROWTH-SAAS-001 — migración idempotente SEM", () => {
  it("sobre estado SEM: crea T001/S001/Domain, conserva cms_config, no duplica al re-ejecutar", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB — se omiten pruebas de integración");
      return;
    }

    const client = new MongoClient(uri);
    let db: Db;
    try {
      await client.connect();
      db = client.db(dbName);
    } catch (error) {
      await client.close().catch(() => undefined);
      t.skip(
        `Mongo no disponible: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    const testHost = "saas-001-test.local";
    type MenuDoc = {
      _id: string;
      tenant?: string;
      name: string;
      location: string;
      active: boolean;
      items: unknown[];
      createdAt: string;
      updatedAt: string;
    };
    const menus = db.collection<MenuDoc>("cms_menus");
    const cmsConfig = db.collection<SiteConfig>("cms_config");
    const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
    const sites = db.collection<SiteDocument>(SITES_COLLECTION);
    const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
    const siteConfigCol = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);

    const markerMenuId = `__saas001_menu_${Date.now()}`;
    let hadLegacy = false;
    let legacySnapshot: Record<string, unknown> | null = null;

    try {
      const legacy = await cmsConfig.findOne({ _id: SITE_CONFIG_ID });
      hadLegacy = Boolean(legacy);
      if (legacy) {
        legacySnapshot = {
          primaryColor: legacy.branding?.primaryColor,
          name: legacy.institution?.name,
          seoTitle: legacy.seo?.title,
        };
      } else {
        await cmsConfig.insertOne(sampleSemConfig());
      }

      await menus.insertOne({
        _id: markerMenuId,
        name: "SAAS-001 marker",
        location: "header",
        active: true,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const first = await ensureSemTenantFoundation(db, { hosts: [testHost] });
      assert.equal(first.tenantId, SEM_TENANT_ID);
      assert.equal(first.siteId, SEM_SITE_ID);
      assert.ok(first.preserved.legacyCmsConfig);

      const second = await ensureSemTenantFoundation(db, { hosts: [testHost] });
      assert.equal(second.created.tenant, false);
      assert.equal(second.created.site, false);
      assert.equal(second.created.domains, 0);
      assert.equal(second.created.siteConfig, false);

      assert.equal(await tenants.countDocuments({ tenantId: SEM_TENANT_ID }), 1);
      assert.equal(await sites.countDocuments({ siteId: SEM_SITE_ID }), 1);
      assert.equal(await domains.countDocuments({ host: testHost }), 1);
      assert.equal(await siteConfigCol.countDocuments({ siteId: SEM_SITE_ID }), 1);
      assert.equal(await tenants.countDocuments({ _id: SEM_TENANT_ID }), 1);

      const legacyAfter = await cmsConfig.findOne({ _id: SITE_CONFIG_ID });
      assert.ok(legacyAfter, "cms_config singleton no debe desaparecer");
      assert.equal(legacyAfter.institution.tenant, SEM_TENANT_ID);

      if (legacySnapshot?.primaryColor) {
        assert.equal(legacyAfter.branding.primaryColor, legacySnapshot.primaryColor);
      }
      if (legacySnapshot?.name) {
        assert.equal(legacyAfter.institution.name, legacySnapshot.name);
      }
      if (legacySnapshot?.seoTitle) {
        assert.equal(legacyAfter.seo.title, legacySnapshot.seoTitle);
      }

      const mirrored = await siteConfigCol.findOne({ _id: SEM_SITE_ID });
      assert.ok(mirrored);
      assert.equal(mirrored.tenantId, SEM_TENANT_ID);
      if (legacySnapshot?.primaryColor) {
        assert.equal(
          (mirrored.branding as { primaryColor?: string })?.primaryColor,
          legacySnapshot.primaryColor
        );
      }

      const markerScoped = `${SEM_TENANT_ID}:${markerMenuId}`;
      const marker = await menus.findOne({
        _id: { $in: [markerMenuId, markerScoped] },
      });
      assert.equal(marker?.tenant, SEM_TENANT_ID);

      const migrationPass = await migration006SaasFoundation.run({
        db,
        log: () => undefined,
      });
      assert.ok(migrationPass.documentsAffected >= 0);
      assert.equal(await tenants.countDocuments({ tenantId: SEM_TENANT_ID }), 1);
    } finally {
      await menus.deleteMany({
        _id: { $in: [markerMenuId, `${SEM_TENANT_ID}:${markerMenuId}`] },
      });
      await domains.deleteOne({ _id: testHost });
      if (!hadLegacy) {
        await cmsConfig.deleteOne({ _id: SITE_CONFIG_ID });
        await tenants.deleteOne({ _id: SEM_TENANT_ID });
        await sites.deleteOne({ _id: SEM_SITE_ID });
        await siteConfigCol.deleteOne({ _id: SEM_SITE_ID });
        await domains.deleteMany({ tenantId: SEM_TENANT_ID });
      }
      await client.close();
    }
  });
});
