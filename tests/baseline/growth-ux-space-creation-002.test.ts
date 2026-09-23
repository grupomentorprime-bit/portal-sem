/**
 * OT-GROWTH-UX-SPACE-CREATION-002 — Cierre funcional Crear Espacio universal.
 * Agente 2: persistencia de categorías, siteName default, host PLATFORM_BASE_DOMAIN,
 * normalización/colisiones, aislamiento SEM/ADL. Sin packs por rubro.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
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
import { buildPlatformSubdomainHost } from "../../src/core/tenant/hosts";
import { listTenants } from "../../src/core/tenant/repositories";
import { loadEnvLocal } from "../../src/core/migrations/env";
import { proposeInitialSpaceHost } from "../../src/lib/platform/propose-space-host";
import {
  SPACE_ORGANIZATION_TYPES,
  isSpaceCreationType,
} from "../../src/lib/platform/space-organization-types";
import { labelTenantType } from "../../src/lib/platform/space-labels";
import { slugify } from "../../src/lib/slugify";

const ROOT = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
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
  await db.collection("identity_audit").deleteMany({
    entityId: slug,
    action: "platform.space.create",
  });
}

describe("OT-GROWTH-UX-SPACE-CREATION-002 — contrato funcional", () => {
  it("ejemplos de producto → identificador sin acentos", () => {
    assert.equal(normalizeSpaceSlug("Mentor Capacitación"), "mentor-capacitacion");
    assert.equal(normalizeSpaceSlug("Panadería Central"), "panaderia-central");
    assert.equal(slugify("Mentor Capacitación"), "mentor-capacitacion");
    assert.equal(slugify("Panadería Central"), "panaderia-central");
  });

  it("host inicial usa PLATFORM_BASE_DOMAIN sin hardcodear clientes", () => {
    assert.equal(
      proposeInitialSpaceHost("mentor-capacitacion", "portales.example.com"),
      "mentor-capacitacion.portales.example.com"
    );
    assert.equal(
      proposeInitialSpaceHost("panaderia-central", null),
      "panaderia-central.localhost:3000"
    );
    assert.equal(
      buildPlatformSubdomainHost("acme", {
        env: { PLATFORM_BASE_DOMAIN: "spaces.growth.example" },
      }),
      "acme.spaces.growth.example"
    );

    const panel = readSrc("src/components/platform/PlatformCreateSpacePanel.tsx");
    const propose = readSrc("src/lib/platform/propose-space-host.ts");
    assert.match(panel, /proposeInitialSpaceHost/);
    assert.match(panel, /platformBaseDomain/);
    assert.match(propose, /SPACE_BASE_DOMAIN/);
    assert.doesNotMatch(propose, /mentorprime|seminarioipn|growthos\.mentor/i);
    assert.doesNotMatch(panel, /mentorprime|seminarioipn/i);
  });

  it("siteName vacío cae al nombre del Espacio (servidor)", () => {
    const service = readSrc("src/core/tenant/create-platform-space.ts");
    assert.match(service, /siteName\s*=\s*input\.siteName\?\.trim\(\)\s*\|\|\s*name/);
    assert.doesNotMatch(service, /El nombre del Sitio es obligatorio/);
  });

  it("categoría no ramifica módulos ni packs; legacy sigue legible", () => {
    const service = readSrc("src/core/tenant/create-platform-space.ts");
    assert.match(service, /buildNeutralConfig|createDefaultSiteConfig/);
    assert.doesNotMatch(service, /if\s*\(\s*type\s*===|switch\s*\(\s*type\s*\)/);
    assert.doesNotMatch(service, /pack|onboarding|Aprende Hoy/i);

    for (const value of SPACE_ORGANIZATION_TYPES.map((t) => t.value)) {
      assert.equal(isSpaceCreationType(value), true, value);
    }
    assert.equal(isSpaceCreationType("institution"), true);
    assert.equal(isSpaceCreationType("academy"), true);
    assert.equal(labelTenantType("institution"), "Institución");
    assert.equal(labelTenantType("academy"), "Academia");
  });

  it("page/catalog cablean PLATFORM_BASE_DOMAIN al panel", () => {
    const page = readSrc("src/app/platform/page.tsx");
    const catalog = readSrc("src/components/platform/PlatformSpacesCatalog.tsx");
    assert.match(page, /resolvePlatformBaseDomain/);
    assert.match(page, /platformBaseDomain=\{platformBaseDomain\}/);
    assert.match(catalog, /platformBaseDomain/);
  });
});

describe("OT-GROWTH-UX-SPACE-CREATION-002 — provisión Mongo", () => {
  it("crea business/education/…, siteName default, colisión y no toca SEM/ADL", async () => {
    await withDb(async (db) => {
      const stamp = Date.now().toString(36);
      const actor = `actor-ux2-${stamp}`;
      const createdSlugs: string[] = [];

      const semBefore = await db
        .collection(TENANTS_COLLECTION)
        .findOne({ tenantId: SEM_TENANT_ID });
      const adlBefore = await db
        .collection(TENANTS_COLLECTION)
        .findOne({ tenantId: ADL_TENANT_ID });

      const moduleFingerprints: string[] = [];

      try {
        for (const org of SPACE_ORGANIZATION_TYPES) {
        const slug = `ot-ux2-${org.value}-${stamp}`;
        createdSlugs.push(slug);
        const host = `${slug}.localhost:3000`;
        const result = await createPlatformSpace(
          db,
          {
            name: `Espacio ${org.label} ${stamp}`,
            slug,
            type: org.value,
            host,
            // siteName omitido a propósito → debe usar el nombre
            siteName: "",
            ownerEmail: null,
          },
          actor
        );

        assert.equal(result.created, true);
        assert.equal(result.type, org.value);
        assert.equal(result.typeLabel, labelTenantType(org.value));
        assert.equal(result.siteName, `Espacio ${org.label} ${stamp}`);

        const tenant = await db
          .collection(TENANTS_COLLECTION)
          .findOne({ tenantId: slug });
        assert.ok(tenant);
        assert.equal(tenant?.type, org.value);

        const listed = await listTenants(db);
        const row = listed.find((t) => t.tenantId === slug);
        assert.ok(row);
        assert.equal(row?.type, org.value);

        const siteConfig = await db.collection(SITE_CONFIG_COLLECTION).findOne({
          tenantId: slug,
        });
        assert.ok(siteConfig);
        const institution = siteConfig?.institution as
          | Record<string, unknown>
          | undefined;
        assert.equal(institution?.shortName, `Espacio ${org.label} ${stamp}`);
        moduleFingerprints.push(JSON.stringify(siteConfig?.modules ?? null));
      }

      // Misma plantilla de módulos para todas las categorías (sin packs por rubro).
      assert.equal(new Set(moduleFingerprints).size, 1);

      // Ejemplos de producto (identificador stamp para no chocar con datos previos)
      const mentorSlug = `mentor-capacitacion-${stamp}`;
      const panSlug = `panaderia-central-${stamp}`;
      createdSlugs.push(mentorSlug, panSlug);

      assert.equal(normalizeSpaceSlug("Mentor Capacitación"), "mentor-capacitacion");
      assert.equal(normalizeSpaceSlug("Panadería Central"), "panaderia-central");

      const mentorFixed = await createPlatformSpace(
        db,
        {
          name: "Mentor Capacitación",
          slug: mentorSlug,
          type: "education",
          host: `${mentorSlug}.localhost:3000`,
          siteName: null,
        },
        actor
      );
      assert.equal(mentorFixed.tenantId, mentorSlug);
      assert.equal(mentorFixed.type, "education");
      assert.equal(mentorFixed.siteName, "Mentor Capacitación");

      const pan = await createPlatformSpace(
        db,
        {
          name: "Panadería Central",
          slug: panSlug,
          type: "business",
          host: `${panSlug}.localhost:3000`,
        },
        actor
      );
      assert.equal(pan.type, "business");
      assert.equal(pan.siteName, "Panadería Central");

      // Colisión de slug
      let slugErr: unknown;
      try {
        await createPlatformSpace(
          db,
          {
            name: "Otro",
            slug: panSlug,
            type: "other",
            host: `other-${stamp}.localhost:3000`,
          },
          actor
        );
      } catch (error) {
        slugErr = error;
      }
      assert.ok(slugErr instanceof CreatePlatformSpaceError);
      assert.equal((slugErr as CreatePlatformSpaceError).code, "slug_taken");

      // Host vía PLATFORM_BASE_DOMAIN (sin hardcode de producto)
      const baseSlug = `ot-ux2-base-${stamp}`;
      createdSlugs.push(baseSlug);
      const prevBase = process.env.PLATFORM_BASE_DOMAIN;
      process.env.PLATFORM_BASE_DOMAIN = "portales.test.example";
      try {
        const withBase = await createPlatformSpace(
          db,
          {
            name: "Base Domain Space",
            slug: baseSlug,
            type: "independent",
            host: "",
            siteName: null,
          },
          actor
        );
        assert.equal(
          withBase.primaryDomain,
          `${baseSlug}.portales.test.example`
        );
      } finally {
        if (prevBase === undefined) delete process.env.PLATFORM_BASE_DOMAIN;
        else process.env.PLATFORM_BASE_DOMAIN = prevBase;
      }

      // Regresión SEM / ADL
      const semAfter = await db
        .collection(TENANTS_COLLECTION)
        .findOne({ tenantId: SEM_TENANT_ID });
      const adlAfter = await db
        .collection(TENANTS_COLLECTION)
        .findOne({ tenantId: ADL_TENANT_ID });
      if (semBefore) {
        assert.equal(semAfter?.updatedAt, semBefore.updatedAt);
        assert.equal(semAfter?.type, semBefore.type);
      }
      if (adlBefore) {
        assert.equal(adlAfter?.updatedAt, adlBefore.updatedAt);
        assert.equal(adlAfter?.type, adlBefore.type);
      }
      } finally {
        for (const slug of createdSlugs) {
          await cleanupSpace(db, slug);
        }
      }
    });
  });
});
