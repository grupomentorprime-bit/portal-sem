import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  DOMAINS_COLLECTION,
  SEM_SITE_ID,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
  SITES_COLLECTION,
  TENANTS_COLLECTION,
} from "../../src/core/tenant/constants";
import {
  normalizeHost,
  resolveAppHostsFromEnv,
  resolveRequestHost,
} from "../../src/core/tenant/hosts";
import {
  isHostResolutionPortalActive,
  isSemEligibleHost,
  resolvePublicTenantByHost,
} from "../../src/core/tenant/resolve";
import { ensureSemTenantFoundation } from "../../src/core/tenant/migrate-sem";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "../../src/core/tenant/types";

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

describe("OT-GROWTH-SAAS-002 — normalización de host", () => {
  it("normaliza host+puerto y URLs", () => {
    assert.equal(normalizeHost("LOCALHOST:3000"), "localhost:3000");
    assert.equal(normalizeHost("https://SeminarioIpn.cl/path"), "seminarioipn.cl");
    assert.equal(normalizeHost("seminarioipn.cl."), "seminarioipn.cl");
    assert.equal(normalizeHost("  Example.COM:8443/ "), "example.com:8443");
    assert.equal(normalizeHost(""), null);
    assert.equal(normalizeHost(null), null);
  });

  it("resolveRequestHost solo usa host / x-forwarded-host (no spoof de tenant)", () => {
    const headers = new Map<string, string>([
      ["host", "localhost:3000"],
      ["x-tenant-id", "otro-tenant"],
      ["x-tenant", "spoofed"],
    ]);
    assert.equal(
      resolveRequestHost({ get: (n) => headers.get(n) ?? null }),
      "localhost:3000"
    );

    const forwarded = new Map<string, string>([
      ["host", "internal:8080"],
      ["x-forwarded-host", "seminarioipn.cl"],
      ["x-site-id", "evil"],
    ]);
    assert.equal(
      resolveRequestHost({ get: (n) => forwarded.get(n) ?? null }),
      "seminarioipn.cl"
    );
  });

  it("loopback es elegible SEM; host público de APP_URL no", () => {
    assert.equal(
      isSemEligibleHost("localhost:3001", {
        APP_URL: "https://growthos.mentorprime.cl",
      }),
      true
    );
    assert.equal(
      isSemEligibleHost("growthos.mentorprime.cl", {
        APP_URL: "https://growthos.mentorprime.cl",
        NEXT_PUBLIC_APP_URL: "https://growthos.mentorprime.cl",
      }),
      false
    );
    assert.equal(
      isSemEligibleHost("evil.example.com", {
        APP_URL: "http://localhost:3000",
      }),
      false
    );
  });
});

describe("OT-GROWTH-SAAS-002 — resolución Host → Tenant", () => {
  it("host desconocido no cae a SEM ni a otro tenant", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
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

    try {
      const result = await resolvePublicTenantByHost(
        "saas-002-unknown-host.invalid",
        {
          db,
          env: {
            APP_URL: "http://localhost:3000",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          },
        }
      );
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unknown_host");
        assert.equal(result.host, "saas-002-unknown-host.invalid");
      }
    } finally {
      await client.close();
    }
  });

  it("host SEM en domains → seminario-ipn; APP_URL público no otorga SEM", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
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

    const testHost = "saas-002-sem.local:3443";
    try {
      await ensureSemTenantFoundation(db, { hosts: [testHost] });

      const byDomain = await resolvePublicTenantByHost(testHost, { db });
      assert.equal(byDomain.ok, true);
      if (byDomain.ok) {
        assert.equal(byDomain.tenantId, SEM_TENANT_ID);
        assert.equal(byDomain.siteId, SEM_SITE_ID);
        assert.equal(byDomain.source, "domain");
        assert.equal(byDomain.config.institution.tenant, SEM_TENANT_ID);
      }

      // Puerto normalizado en lookup
      const withCase = await resolvePublicTenantByHost("SAAS-002-SEM.LOCAL:3443", {
        db,
      });
      assert.equal(withCase.ok, true);
      if (withCase.ok) assert.equal(withCase.tenantId, SEM_TENANT_ID);

      // APP_URL pública sin fila domain → no SEM (origen de plataforma ≠ tenant)
      const appHost = "saas-002-appurl-only.local";
      const compat = await resolvePublicTenantByHost(appHost, {
        db,
        env: {
          APP_URL: `https://${appHost}`,
        },
      });
      assert.equal(compat.ok, false);
      if (!compat.ok) {
        assert.equal(compat.reason, "unknown_host");
      }

      // Loopback sin domain → compat legacy SEM (dev)
      const loopback = await resolvePublicTenantByHost("127.0.0.1:3999", {
        db,
        env: {
          APP_URL: "https://growthos.mentorprime.cl",
        },
      });
      assert.equal(loopback.ok, true);
      if (loopback.ok) {
        assert.equal(loopback.tenantId, SEM_TENANT_ID);
        assert.equal(loopback.source, "sem-app-url-compat");
      }
    } finally {
      await db
        .collection<DomainDocument>(DOMAINS_COLLECTION)
        .deleteOne({ _id: testHost });
      await client.close();
    }
  });

  it("tenant/site inactivo no entrega portal de otro tenant", async (t) => {
    loadTestMongoEnv();
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri || !dbName) {
      t.skip("Sin MONGODB_URI/MONGODB_DB");
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

    const suffix = Date.now();
    const tenantId = `saas-002-inactive-${suffix}`;
    const siteId = tenantId;
    const host = `inactive-${suffix}.saas-002.test`;
    const at = new Date().toISOString();

    const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
    const sites = db.collection<SiteDocument>(SITES_COLLECTION);
    const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
    const siteConfig = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);

    const base = createDefaultSiteConfig();
    const configDoc: SiteConfigDocument = {
      _id: siteId,
      tenantId,
      siteId,
      schemaVersion: base.schemaVersion,
      modules: base.modules,
      institution: {
        ...base.institution,
        name: "Inactive Fixture",
        tenant: tenantId,
        status: "inactive",
      },
      branding: base.branding,
      seo: base.seo,
      contact: base.contact,
      social: base.social,
      features: base.features,
      createdAt: at,
      updatedAt: at,
    };

    try {
      await tenants.insertOne({
        _id: tenantId,
        tenantId,
        code: "T-TEST",
        name: "Inactive Fixture",
        slug: tenantId,
        status: "inactive",
        type: "institution",
        defaultSiteId: siteId,
        createdAt: at,
        updatedAt: at,
      });
      await sites.insertOne({
        _id: siteId,
        siteId,
        tenantId,
        code: "S-TEST",
        name: "Inactive Site",
        slug: siteId,
        status: "inactive",
        isDefault: true,
        createdAt: at,
        updatedAt: at,
      });
      await domains.insertOne({
        _id: host,
        host,
        tenantId,
        siteId,
        isPrimary: true,
        kind: "custom",
        createdAt: at,
        updatedAt: at,
      });
      await siteConfig.insertOne(configDoc);

      const result = await resolvePublicTenantByHost(host, { db });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.tenantId, tenantId);
        assert.notEqual(result.tenantId, SEM_TENANT_ID);
        assert.equal(result.status, "inactive");
        assert.equal(isHostResolutionPortalActive(result), false);
        assert.equal(result.config.institution.tenant, tenantId);
      }

      // Spoof: query/header no forman parte de resolvePublicTenantByHost
      const spoofed = await resolvePublicTenantByHost(host, { db });
      assert.equal(spoofed.ok, true);
      if (spoofed.ok) assert.equal(spoofed.tenantId, tenantId);
    } finally {
      await domains.deleteOne({ _id: host });
      await siteConfig.deleteOne({ _id: siteId });
      await sites.deleteOne({ _id: siteId });
      await tenants.deleteOne({ _id: tenantId });
      await client.close();
    }
  });

  it("resolveAppHostsFromEnv describe origen de app, no identidad SEM", () => {
    assert.deepEqual(
      resolveAppHostsFromEnv({
        NODE_ENV: "test",
        APP_URL: "http://localhost:3000",
      }),
      ["localhost:3000"]
    );
    assert.equal(
      isSemEligibleHost("growthos.mentorprime.cl", {
        APP_URL: "https://growthos.mentorprime.cl",
      }),
      false
    );
  });
});
