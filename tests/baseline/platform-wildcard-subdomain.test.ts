/**
 * Subdominio automático por Espacio sobre el wildcard de la plataforma.
 * Crear un Espacio registra `{slug}.{apex}` y ese host resuelve solo ese Espacio.
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
import {
  CreatePlatformSpaceError,
  createPlatformSpace,
} from "../../src/core/tenant/create-platform-space";
import { homologateSitePlatformDomain } from "../../src/core/tenant/homologate-domains";
import { ensureDomainIndexes } from "../../src/core/tenant/domains";
import {
  buildDefaultSpaceHost,
  isPlatformOriginHost,
  isReservedPlatformHost,
  isReservedSpaceSlug,
  publicOriginFromHost,
  resolvePlatformBaseDomain,
  resolveSpaceBaseDomain,
} from "../../src/core/tenant/hosts";
import { resolvePublicTenantByHost } from "../../src/core/tenant/resolve";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import type {
  DomainDocument,
  SiteConfigDocument,
  SiteDocument,
  TenantDocument,
} from "../../src/core/tenant/types";

const PLATFORM_HOST = "growthos.mentorprime.cl";
const SPACE_BASE = "mentorprime.cl";
const PLATFORM_ENV = {
  APP_URL: `https://${PLATFORM_HOST}`,
  NEXT_PUBLIC_APP_URL: `https://${PLATFORM_HOST}`,
  SPACE_BASE_DOMAIN: SPACE_BASE,
};

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
  await db.collection("identity_memberships").deleteMany({ tenantId });
  await db.collection("growth_automations").deleteMany({ tenantId });
  await db.collection("growth_automation_versions").deleteMany({ tenantId });
  await db.collection("identity_audit").deleteMany({
    entityId: tenantId,
    action: "platform.space.create",
  });
}

describe("wildcard de Espacios — dirección pública", () => {
  it("SPACE_BASE_DOMAIN es la base; APP_URL no crea el subdominio", () => {
    assert.equal(resolveSpaceBaseDomain(PLATFORM_ENV), SPACE_BASE);
    assert.equal(resolvePlatformBaseDomain(PLATFORM_ENV), SPACE_BASE);
    assert.equal(
      resolveSpaceBaseDomain({
        APP_URL: `https://${PLATFORM_HOST}`,
        NEXT_PUBLIC_APP_URL: `https://${PLATFORM_HOST}`,
      }),
      null
    );
    assert.equal(
      resolvePlatformBaseDomain({
        APP_URL: `https://${PLATFORM_HOST}`,
        PLATFORM_BASE_DOMAIN: "portales.example.com",
      }),
      "portales.example.com"
    );
    assert.equal(
      resolvePlatformBaseDomain({
        APP_URL: `https://${PLATFORM_HOST}`,
        PLATFORM_BASE_DOMAIN: "growthos.mentorprime.cl",
        SPACE_BASE_DOMAIN: SPACE_BASE,
      }),
      SPACE_BASE
    );
    assert.equal(
      buildDefaultSpaceHost("mentor-prime-capacitacion", { env: PLATFORM_ENV }),
      `mentor-prime-capacitacion.${SPACE_BASE}`
    );
    assert.equal(
      buildDefaultSpaceHost("growthos", { env: PLATFORM_ENV }),
      null
    );
    assert.equal(isReservedSpaceSlug("vps1"), true);
    assert.equal(isReservedSpaceSlug("backend-keycloak"), true);
    assert.equal(isReservedSpaceSlug("mentor-prime-capacitacion"), false);
    assert.equal(
      buildDefaultSpaceHost("mentor-prime-capacitacion", {
        env: { APP_URL: "http://localhost:3000" },
      }),
      "mentor-prime-capacitacion.localhost:3000"
    );
    assert.equal(
      publicOriginFromHost(`mentor-prime-capacitacion.${SPACE_BASE}`),
      `https://mentor-prime-capacitacion.${SPACE_BASE}`
    );
    assert.equal(
      isPlatformOriginHost(`mentor-prime-capacitacion.${SPACE_BASE}`, PLATFORM_ENV),
      false
    );
    assert.equal(isPlatformOriginHost(PLATFORM_HOST, PLATFORM_ENV), true);
    assert.equal(isReservedPlatformHost(PLATFORM_HOST, { env: PLATFORM_ENV }), true);
    assert.equal(
      isReservedPlatformHost(`vps1.${SPACE_BASE}`, { env: PLATFORM_ENV }),
      true
    );
    assert.equal(
      isReservedPlatformHost(`backend-keycloak.${SPACE_BASE}`, { env: PLATFORM_ENV }),
      true
    );
    assert.equal(
      isReservedPlatformHost(`mentor-prime-capacitacion.${SPACE_BASE}`, {
        env: PLATFORM_ENV,
      }),
      false
    );
    assert.equal(resolvePlatformBaseDomain({ APP_URL: "http://localhost:3000" }), null);
  });

  it("migración 026 rehomologa el subdominio público", () => {
    const registry = readFileSync(
      resolve(process.cwd(), "src/core/migrations/registry.ts"),
      "utf8"
    );
    assert.match(registry, /026-platform-wildcard-subdomains/);
    assert.match(registry, /migration026PlatformWildcardSubdomains/);
    const source = readFileSync(
      resolve(process.cwd(), "src/core/migrations/026-platform-wildcard-subdomains.ts"),
      "utf8"
    );
    assert.match(source, /resolveSpaceBaseDomain/);
    assert.match(source, /SPACE_BASE_DOMAIN no está definido/);
    assert.doesNotMatch(source, /resolveAppHostsFromEnv|env\.APP_URL/);
  });
});

describe("wildcard de Espacios — alta y resolución", () => {
  it("crear un Espacio publica su subdominio y no mezcla sitios", async (t) => {
    await withDb(t, async (db) => {
      await ensureDomainIndexes(db);
      const stamp = Date.now().toString(36);
      const slugA = `mentor-prime-cap-${stamp}`;
      const slugB = `otro-espacio-${stamp}`;
      const prevApp = process.env.APP_URL;
      const prevPublic = process.env.NEXT_PUBLIC_APP_URL;
      const prevBase = process.env.PLATFORM_BASE_DOMAIN;
      const prevSpace = process.env.SPACE_BASE_DOMAIN;
      process.env.APP_URL = PLATFORM_ENV.APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = PLATFORM_ENV.NEXT_PUBLIC_APP_URL;
      process.env.SPACE_BASE_DOMAIN = SPACE_BASE;
      delete process.env.PLATFORM_BASE_DOMAIN;

      const apexBefore = await db
        .collection<DomainDocument>(DOMAINS_COLLECTION)
        .countDocuments({ host: PLATFORM_HOST });

      try {
        const created = await createPlatformSpace(
          db,
          {
            name: "Mentor Prime Capacitación",
            slug: slugA,
            type: "education",
            host: "",
          },
          "actor-wildcard"
        );
        assert.equal(created.primaryDomain, `${slugA}.${SPACE_BASE}`);

        const domain = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ host: `${slugA}.${SPACE_BASE}` });
        assert.equal(domain?.kind, "platform_subdomain");
        assert.equal(domain?.isPrimary, true);
        assert.equal(domain?.tenantId, slugA);

        const other = await createPlatformSpace(
          db,
          {
            name: "Otro Espacio",
            slug: slugB,
            type: "business",
            host: "",
          },
          "actor-wildcard"
        );
        assert.equal(other.primaryDomain, `${slugB}.${SPACE_BASE}`);

        const resolvedA = await resolvePublicTenantByHost(`${slugA}.${SPACE_BASE}`, { db });
        const resolvedB = await resolvePublicTenantByHost(`${slugB}.${SPACE_BASE}`, { db });
        assert.equal(resolvedA.ok, true);
        assert.equal(resolvedB.ok, true);
        if (resolvedA.ok && resolvedB.ok) {
          assert.equal(resolvedA.tenantId, slugA);
          assert.equal(resolvedA.siteId, slugA);
          assert.equal(resolvedB.tenantId, slugB);
          assert.notEqual(resolvedA.tenantId, resolvedB.tenantId);
        }

        const apex = await resolvePublicTenantByHost(PLATFORM_HOST, { db });
        assert.equal(apex.ok, false);
        if (!apex.ok) assert.equal(apex.reason, "unknown_host");

        const unknown = await resolvePublicTenantByHost(`sin-espacio.${SPACE_BASE}`, { db });
        assert.equal(unknown.ok, false);

        const apexAfter = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .countDocuments({ host: PLATFORM_HOST });
        assert.equal(apexAfter, apexBefore);

        await assert.rejects(
          () =>
            createPlatformSpace(
              db,
              {
                name: "Apex tomado",
                slug: `apex-${stamp}`,
                type: "other",
                host: PLATFORM_HOST,
              },
              "actor-wildcard"
            ),
          (error: unknown) =>
            error instanceof CreatePlatformSpaceError && error.code === "invalid_host"
        );
      } finally {
        if (prevApp === undefined) delete process.env.APP_URL;
        else process.env.APP_URL = prevApp;
        if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
        else process.env.NEXT_PUBLIC_APP_URL = prevPublic;
        if (prevBase === undefined) delete process.env.PLATFORM_BASE_DOMAIN;
        else process.env.PLATFORM_BASE_DOMAIN = prevBase;
        if (prevSpace === undefined) delete process.env.SPACE_BASE_DOMAIN;
        else process.env.SPACE_BASE_DOMAIN = prevSpace;
        await cleanup(db, slugA);
        await cleanup(db, slugB);
        await cleanup(db, `apex-${stamp}`);
      }
    });
  });

  it("homologa el subdominio público y conserva un dominio propio primario", async (t) => {
    await withDb(t, async (db) => {
      await ensureDomainIndexes(db);
      const stamp = Date.now().toString(36);
      const devTenant = `wild-dev-${stamp}`;
      const customTenant = `wild-custom-${stamp}`;
      const env = {
        SPACE_BASE_DOMAIN: SPACE_BASE,
        APP_URL: `https://${PLATFORM_HOST}`,
      };
      const at = new Date().toISOString();
      const base = createDefaultSiteConfig();

      async function seed(
        tenantId: string,
        host: string,
        kind: "legacy" | "custom"
      ): Promise<void> {
        await db.collection<TenantDocument>(TENANTS_COLLECTION).insertOne({
          _id: tenantId,
          tenantId,
          code: tenantId.toUpperCase(),
          name: tenantId,
          slug: tenantId,
          status: "active",
          type: "education",
          defaultSiteId: tenantId,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteDocument>(SITES_COLLECTION).insertOne({
          _id: tenantId,
          siteId: tenantId,
          tenantId,
          code: tenantId,
          name: tenantId,
          slug: tenantId,
          status: "active",
          isDefault: true,
          createdAt: at,
          updatedAt: at,
        });
        await db.collection<SiteConfigDocument>("site_config").insertOne({
          _id: tenantId,
          tenantId,
          siteId: tenantId,
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
          _id: host,
          host,
          tenantId,
          siteId: tenantId,
          isPrimary: true,
          kind,
          createdAt: at,
          updatedAt: at,
        });
      }

      try {
        const devHost = `${devTenant}.localhost:3000`;
        await seed(devTenant, devHost, "legacy");
        const homologated = await homologateSitePlatformDomain(
          db,
          { siteId: devTenant, tenantId: devTenant, slug: devTenant },
          env
        );
        assert.equal(homologated.defaultHost, `${devTenant}.${SPACE_BASE}`);
        assert.equal(homologated.created, true);
        assert.equal(homologated.primaryHost, `${devTenant}.${SPACE_BASE}`);

        const primary = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ siteId: devTenant, isPrimary: true });
        assert.equal(primary?.host, `${devTenant}.${SPACE_BASE}`);
        assert.equal(primary?.kind, "platform_subdomain");

        const customHost = `www-${stamp}.cliente.test`;
        await seed(customTenant, customHost, "custom");
        const kept = await homologateSitePlatformDomain(
          db,
          { siteId: customTenant, tenantId: customTenant, slug: customTenant },
          env
        );
        assert.equal(kept.primaryHost, customHost);
        const alias = await db
          .collection<DomainDocument>(DOMAINS_COLLECTION)
          .findOne({ host: `${customTenant}.${SPACE_BASE}` });
        assert.equal(alias?.kind, "platform_subdomain");
        assert.equal(alias?.isPrimary, false);
      } finally {
        await cleanup(db, devTenant);
        await cleanup(db, customTenant);
      }
    });
  });
});
