/**
 * OT-GROWTH-SAAS-008 — dominios por Site.
 * Primary / alias, unicidad global, mutaciones seguras, sin hardcode de cliente.
 */
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
  addDomainToSite,
  changeDomainHost,
  ensureDomainIndexes,
  getPrimaryDomain,
  listSiteDomains,
  removeDomainFromSite,
  setPrimaryDomain,
} from "../../src/core/tenant/domains";
import {
  buildDefaultSpaceHost,
  buildPlatformSubdomainHost,
  classifySpaceDomainKind,
  isBarePlatformOriginHost,
  isPlatformSubdomainHost,
  normalizeHost,
  resolvePlatformBaseDomain,
} from "../../src/core/tenant/hosts";
import {
  isHostResolutionPortalActive,
  resolvePublicTenantByHost,
} from "../../src/core/tenant/resolve";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "../../src/core/tenant/types";

const FIX_PREFIX = "tenant-saas008";

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

async function seedSite(
  db: Db,
  tenantId: string,
  siteId: string,
  status: "active" | "inactive" = "active"
): Promise<void> {
  const at = new Date().toISOString();
  const base = createDefaultSiteConfig();
  const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
  const sites = db.collection<SiteDocument>(SITES_COLLECTION);
  const siteConfig = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);

  await tenants.deleteOne({ _id: tenantId });
  await sites.deleteOne({ _id: siteId });
  await siteConfig.deleteOne({ _id: siteId });

  await tenants.insertOne({
    _id: tenantId,
    tenantId,
    code: "T-SAAS008",
    name: "SAAS-008 Fixture",
    slug: tenantId,
    status,
    type: "institution",
    defaultSiteId: siteId,
    createdAt: at,
    updatedAt: at,
  });

  await sites.insertOne({
    _id: siteId,
    siteId,
    tenantId,
    code: "S-SAAS008",
    name: "SAAS-008 Site",
    slug: siteId,
    status,
    isDefault: true,
    createdAt: at,
    updatedAt: at,
  });

  await siteConfig.insertOne({
    _id: siteId,
    tenantId,
    siteId,
    schemaVersion: base.schemaVersion,
    modules: base.modules,
    institution: {
      ...base.institution,
      name: "SAAS-008 Fixture",
      tenant: tenantId,
      status,
    },
    branding: base.branding,
    seo: base.seo,
    contact: base.contact,
    social: base.social,
    features: base.features,
    createdAt: at,
    updatedAt: at,
  });
}

async function cleanupSite(
  db: Db,
  tenantId: string,
  siteId: string,
  hosts: string[]
): Promise<void> {
  const domains = db.collection<DomainDocument>(DOMAINS_COLLECTION);
  for (const host of hosts) {
    await domains.deleteOne({ _id: host });
  }
  await domains.deleteMany({ siteId });
  await db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION).deleteOne({
    _id: siteId,
  });
  await db.collection<SiteDocument>(SITES_COLLECTION).deleteOne({ _id: siteId });
  await db.collection<TenantDocument>(TENANTS_COLLECTION).deleteOne({
    _id: tenantId,
  });
}

describe("OT-GROWTH-SAAS-008 — helpers de plataforma", () => {
  it("normaliza puerto/mayúsculas y construye subdominio de plataforma", () => {
    assert.equal(normalizeHost("Alias.Example.COM:8443"), "alias.example.com:8443");
    assert.equal(
      resolvePlatformBaseDomain({ PLATFORM_BASE_DOMAIN: "Portales.Example.com" }),
      "portales.example.com"
    );
    assert.equal(
      buildPlatformSubdomainHost("Acme Org", {
        baseDomain: "portales.example.com",
      }),
      "acme-org.portales.example.com"
    );
    assert.equal(
      buildPlatformSubdomainHost("acme", {
        env: {},
      }),
      null
    );
    assert.equal(
      buildDefaultSpaceHost("fundacion-mueve", {
        env: { APP_URL: "http://localhost:3000" },
      }),
      "fundacion-mueve.localhost:3000"
    );
    assert.equal(
      buildDefaultSpaceHost("acme", {
        env: { PLATFORM_BASE_DOMAIN: "portales.example.com" },
      }),
      "acme.portales.example.com"
    );
    assert.equal(isBarePlatformOriginHost("localhost:3000"), true);
    assert.equal(isBarePlatformOriginHost("adl.localhost:3000"), false);
    assert.equal(
      isPlatformSubdomainHost("adl", "adl.localhost:3000", { env: {} }),
      true
    );
    assert.equal(
      classifySpaceDomainKind("adl", "adl.localhost:3000", { env: {} }),
      "platform_subdomain"
    );
    assert.equal(
      classifySpaceDomainKind("adl", "academia-adl.cl", { env: {} }),
      "custom"
    );
  });
});

describe("OT-GROWTH-SAAS-008 — dominios por Site", () => {
  it("primary y alias resuelven el mismo Site; host desconocido no cae a SEM", async (t) => {
    await withDb(t, async (db) => {
      await ensureDomainIndexes(db);
      const suffix = Date.now();
      const tenantId = `${FIX_PREFIX}-a-${suffix}`;
      const siteId = tenantId;
      const primaryHost = `primary-${suffix}.saas008.test`;
      const aliasHost = `alias-${suffix}.saas008.test`;
      const unknownHost = `unknown-${suffix}.saas008.invalid`;

      try {
        await seedSite(db, tenantId, siteId);

        const primary = await addDomainToSite(db, {
          host: `PRIMARY-${suffix}.SAAS008.TEST`,
          siteId,
          isPrimary: true,
          kind: "custom",
        });
        assert.equal(primary.ok, true);
        if (primary.ok) {
          assert.equal(primary.domain.host, primaryHost);
          assert.equal(primary.domain.isPrimary, true);
        }

        const alias = await addDomainToSite(db, {
          host: aliasHost,
          siteId,
          isPrimary: false,
          kind: "custom",
        });
        assert.equal(alias.ok, true);
        if (alias.ok) {
          assert.equal(alias.domain.isPrimary, false);
          assert.equal(alias.domains.filter((d) => d.isPrimary).length, 1);
        }

        const byPrimary = await resolvePublicTenantByHost(primaryHost, { db });
        assert.equal(byPrimary.ok, true);
        if (byPrimary.ok) {
          assert.equal(byPrimary.tenantId, tenantId);
          assert.equal(byPrimary.siteId, siteId);
          assert.equal(byPrimary.source, "domain");
          assert.equal(byPrimary.domain?.isPrimary, true);
        }

        const byAlias = await resolvePublicTenantByHost(
          `ALIAS-${suffix}.SAAS008.TEST`,
          { db }
        );
        assert.equal(byAlias.ok, true);
        if (byAlias.ok) {
          assert.equal(byAlias.tenantId, tenantId);
          assert.equal(byAlias.siteId, siteId);
          assert.equal(byAlias.domain?.isPrimary, false);
        }

        const unknown = await resolvePublicTenantByHost(unknownHost, {
          db,
          env: {
            APP_URL: "http://localhost:3000",
            NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          },
        });
        assert.equal(unknown.ok, false);
        if (!unknown.ok) {
          assert.equal(unknown.reason, "unknown_host");
          assert.notEqual(unknown.host, SEM_TENANT_ID);
        }
      } finally {
        await cleanupSite(db, tenantId, siteId, [primaryHost, aliasHost]);
      }
    });
  });

  it("host duplicado entre Sites queda bloqueado", async (t) => {
    await withDb(t, async (db) => {
      const suffix = Date.now();
      const a = `${FIX_PREFIX}-dup-a-${suffix}`;
      const b = `${FIX_PREFIX}-dup-b-${suffix}`;
      const sharedHost = `shared-${suffix}.saas008.test`;

      try {
        await seedSite(db, a, a);
        await seedSite(db, b, b);

        const first = await addDomainToSite(db, {
          host: sharedHost,
          siteId: a,
          kind: "custom",
        });
        assert.equal(first.ok, true);

        const conflict = await addDomainToSite(db, {
          host: `SHARED-${suffix}.SAAS008.TEST`,
          siteId: b,
          kind: "custom",
        });
        assert.equal(conflict.ok, false);
        if (!conflict.ok) {
          assert.equal(conflict.reason, "host_taken");
          assert.equal(conflict.conflictSiteId, a);
        }

        const resolveA = await resolvePublicTenantByHost(sharedHost, { db });
        assert.equal(resolveA.ok, true);
        if (resolveA.ok) assert.equal(resolveA.siteId, a);
      } finally {
        await cleanupSite(db, a, a, [sharedHost]);
        await cleanupSite(db, b, b, []);
      }
    });
  });

  it("cambio de dominio principal mantiene un único isPrimary", async (t) => {
    await withDb(t, async (db) => {
      const suffix = Date.now();
      const tenantId = `${FIX_PREFIX}-pri-${suffix}`;
      const siteId = tenantId;
      const hostA = `a-${suffix}.saas008.test`;
      const hostB = `b-${suffix}.saas008.test`;

      try {
        await seedSite(db, tenantId, siteId);
        await addDomainToSite(db, { host: hostA, siteId, isPrimary: true });
        await addDomainToSite(db, { host: hostB, siteId, isPrimary: false });

        const switched = await setPrimaryDomain(db, { host: hostB, siteId });
        assert.equal(switched.ok, true);
        if (switched.ok) {
          assert.equal(switched.domain.host, hostB);
          assert.equal(switched.domain.isPrimary, true);
          assert.equal(switched.domains.filter((d) => d.isPrimary).length, 1);
        }

        const primary = await getPrimaryDomain(db, siteId);
        assert.equal(primary?.host, hostB);

        const list = await listSiteDomains(db, siteId);
        assert.equal(list.length, 2);
        assert.equal(list[0]?.host, hostB);
      } finally {
        await cleanupSite(db, tenantId, siteId, [hostA, hostB]);
      }
    });
  });

  it("baja segura y cambio de host; platform subdomain se registra sin DNS", async (t) => {
    await withDb(t, async (db) => {
      const suffix = Date.now();
      const tenantId = `${FIX_PREFIX}-mut-${suffix}`;
      const siteId = tenantId;
      const customHost = `custom-${suffix}.saas008.test`;
      const renamedHost = `renamed-${suffix}.saas008.test`;
      const platformHost = buildPlatformSubdomainHost(siteId, {
        baseDomain: "portales.saas008.test",
      });
      assert.ok(platformHost);

      try {
        await seedSite(db, tenantId, siteId);

        await addDomainToSite(db, {
          host: customHost,
          siteId,
          kind: "custom",
          isPrimary: true,
        });
        const platform = await addDomainToSite(db, {
          host: platformHost!,
          siteId,
          kind: "platform_subdomain",
          isPrimary: false,
        });
        assert.equal(platform.ok, true);
        if (platform.ok) {
          assert.equal(platform.domain.kind, "platform_subdomain");
        }

        const renamed = await changeDomainHost(db, {
          siteId,
          fromHost: customHost,
          toHost: renamedHost,
        });
        assert.equal(renamed.ok, true);
        if (renamed.ok) {
          assert.equal(renamed.domain.host, renamedHost);
          assert.equal(renamed.domain.isPrimary, true);
        }

        const stillPrimary = await resolvePublicTenantByHost(renamedHost, { db });
        assert.equal(stillPrimary.ok, true);
        if (stillPrimary.ok) assert.equal(stillPrimary.siteId, siteId);

        const byPlatform = await resolvePublicTenantByHost(platformHost!, { db });
        assert.equal(byPlatform.ok, true);
        if (byPlatform.ok) assert.equal(byPlatform.siteId, siteId);

        const removedAlias = await removeDomainFromSite(db, {
          host: platformHost!,
          siteId,
        });
        assert.equal(removedAlias.ok, true);
        if (removedAlias.ok) {
          assert.equal(removedAlias.domains.length, 1);
          assert.equal(removedAlias.domains[0]?.isPrimary, true);
        }

        // Quitar primary restante → Site sin domains (no cae a SEM)
        const removedLast = await removeDomainFromSite(db, {
          host: renamedHost,
          siteId,
        });
        assert.equal(removedLast.ok, true);
        if (removedLast.ok) assert.equal(removedLast.domains.length, 0);

        const orphan = await resolvePublicTenantByHost(renamedHost, {
          db,
          env: { APP_URL: "http://localhost:3000" },
        });
        assert.equal(orphan.ok, false);
        if (!orphan.ok) assert.equal(orphan.reason, "unknown_host");
      } finally {
        await cleanupSite(db, tenantId, siteId, [
          customHost,
          renamedHost,
          platformHost!,
        ]);
      }
    });
  });

  it("tenant/site inactivo no deriva a otro Espacio", async (t) => {
    await withDb(t, async (db) => {
      const suffix = Date.now();
      const tenantId = `${FIX_PREFIX}-off-${suffix}`;
      const siteId = tenantId;
      const host = `off-${suffix}.saas008.test`;

      try {
        await seedSite(db, tenantId, siteId, "inactive");
        await addDomainToSite(db, { host, siteId, kind: "custom" });

        const result = await resolvePublicTenantByHost(host, { db });
        assert.equal(result.ok, true);
        if (result.ok) {
          assert.equal(result.tenantId, tenantId);
          assert.notEqual(result.tenantId, SEM_TENANT_ID);
          assert.notEqual(result.siteId, SEM_SITE_ID);
          assert.equal(result.status, "inactive");
          assert.equal(isHostResolutionPortalActive(result), false);
        }
      } finally {
        await cleanupSite(db, tenantId, siteId, [host]);
      }
    });
  });
});
