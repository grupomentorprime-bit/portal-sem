/**
 * OT-GROWTH-SAAS-009 — T002 Academia ADL + coexistencia multi-tenant.
 * Reutiliza SAAS-001→008. Sin ramas `if (tenant === "adl")`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  ADL_DEV_HOST_DEFAULT,
  ADL_SITE_CODE,
  ADL_SITE_ID,
  ADL_TENANT_CODE,
  ADL_TENANT_ID,
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
  ADL_SITE_IDENTITY,
  applyAdlSiteIdentity,
  configLooksLikeAdlIdentity,
} from "../../src/core/tenant/adl-site-identity";
import { SEM_SITE_IDENTITY } from "../../src/core/tenant/sem-site-identity";
import { ensureAdlTenantFoundation } from "../../src/core/tenant/migrate-adl";
import { migration012SaasAdlTenant } from "../../src/core/migrations/012-saas-adl-tenant";
import {
  isHostResolutionPortalActive,
  resolvePublicTenantByHost,
} from "../../src/core/tenant/resolve";
import { isSemTenant } from "../../src/core/tenant/is-sem";
import {
  logicalResourceId,
  scopedResourceId,
  storageIntegrationIdForTenant,
} from "../../src/core/tenant/resource-ids";
import { pickActiveTenantId } from "../../src/core/identity/spaces/pick-active-tenant";
import { roleIdForTenant } from "../../src/core/identity/roles/defaults";
import { ROLE_CODES } from "../../src/core/identity/roles/codes";
import { buildBrandThemeStyle } from "../../src/core/branding/theme";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import {
  getDefaultMenusForTenant,
  PLATFORM_DEFAULT_MENUS,
  SEM_DEFAULT_MENUS,
} from "../../src/lib/cms/menu-defaults";
import {
  getConvocatoriaGenerations,
  PLATFORM_CONVOCATORIA_GENERATIONS,
} from "../../src/lib/experience/forms/generations";
import { createEmptyAdmissionConfig } from "../../src/lib/portal/empty-admission";
import { resolveFooterContent } from "../../src/lib/portal/footer-content";
import { shouldUseHomeDemoContent } from "../../src/lib/portal/institutional-demo";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type { PortalFooterPremiumViewModel } from "../../src/types/footer-premium";
import type {
  DomainDocument,
  SiteConfigDocument,
  TenantDocument,
} from "../../src/core/tenant/types";

type StringIdDoc = {
  _id: string;
  tenant?: string;
  tenantId?: string;
  slug?: string;
  enabled?: boolean;
  status?: string;
  roleIds?: string[];
  userId?: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  joinedAt?: string;
  items?: unknown;
  institution?: unknown;
};

const FIX_USER = "user-saas009-switch";
const SEM_MARKERS = [
  "Seminario Eclesiástico Mayor",
  "seminarioipn",
  "IPN Chile",
  "Talca Aurora",
  "G-2023",
  "logo-sem",
  "logo-ipn",
];

const ADL_RUNTIME_ALLOWLIST = new Set([
  "src/core/tenant/constants.ts",
  "src/core/tenant/adl-site-identity.ts",
  "src/core/tenant/migrate-adl.ts",
  "src/core/tenant/index.ts",
  "src/core/migrations/012-saas-adl-tenant.ts",
  "src/core/migrations/registry.ts",
]);

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

function containsSemMarker(text: string): boolean {
  const lower = text.toLowerCase();
  return SEM_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

function emptyFooterViewModel(): PortalFooterPremiumViewModel {
  return {
    settings: {
      showDescription: true,
      showNavigation: true,
      showContact: true,
      showSocial: true,
      showLegal: true,
      showNewsletter: false,
      showCertifications: false,
    },
    brand: {
      institutionName: "",
      institutionShortName: "",
      logoPrimary: "",
      tagline: "",
    },
    navigation: [],
    contact: null,
    social: [],
    legal: [],
    copyright: "",
    backToTopLabel: "Volver arriba",
  };
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, acc);
      continue;
    }
    if (entry.endsWith(".ts") || entry.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

describe("OT-GROWTH-SAAS-009 — contrato T002 y anti-rama ADL", () => {
  it("IDs contractuales T001 ≠ T002 y host de desarrollo distinto", () => {
    assert.equal(SEM_TENANT_ID, "seminario-ipn");
    assert.equal(SEM_TENANT_CODE, "T001");
    assert.equal(SEM_SITE_ID, "seminario-ipn");
    assert.equal(SEM_SITE_CODE, "S001");
    assert.equal(ADL_TENANT_ID, "adl");
    assert.equal(ADL_TENANT_CODE, "T002");
    assert.equal(ADL_SITE_ID, "adl");
    assert.equal(ADL_SITE_CODE, "S002");
    assert.notEqual(ADL_TENANT_ID, SEM_TENANT_ID);
    assert.notEqual(ADL_SITE_ID, SEM_SITE_ID);
    assert.equal(ADL_DEV_HOST_DEFAULT, "adl.localhost:3000");
    assert.notEqual(ADL_DEV_HOST_DEFAULT, "localhost:3000");
    assert.equal(isSemTenant(ADL_TENANT_ID), false);
  });

  it("branding ADL es dato de bootstrap, distinto de SEM y de la plantilla vacía", () => {
    const empty = createDefaultSiteConfig();
    const adl = applyAdlSiteIdentity(empty);
    assert.equal(configLooksLikeAdlIdentity(adl), true);
    assert.equal(adl.institution.name, "Academia ADL");
    assert.equal(adl.institution.shortName, "ADL");
    assert.equal(adl.branding.primaryColor, ADL_SITE_IDENTITY.branding.primaryColor);
    assert.notEqual(adl.branding.primaryColor, SEM_SITE_IDENTITY.branding.primaryColor);
    assert.notEqual(adl.branding.secondaryColor, SEM_SITE_IDENTITY.branding.secondaryColor);
    assert.equal(containsSemMarker(JSON.stringify(adl)), false);
    assert.equal(adl.branding.logo.includes("logo-sem"), false);

    const themeAdl = buildBrandThemeStyle(adl.branding);
    const themeSem = buildBrandThemeStyle(SEM_SITE_IDENTITY.branding);
    assert.ok(themeAdl);
    assert.ok(themeSem);
    assert.notEqual(themeAdl["--brand-primary"], themeSem["--brand-primary"]);
  });

  it("ADL usa menús/generaciones/admisión/footer de plataforma, no pack SEM", () => {
    assert.equal(getDefaultMenusForTenant(ADL_TENANT_ID), PLATFORM_DEFAULT_MENUS);
    assert.notEqual(getDefaultMenusForTenant(ADL_TENANT_ID), SEM_DEFAULT_MENUS);
    assert.equal(containsSemMarker(JSON.stringify(getDefaultMenusForTenant(ADL_TENANT_ID))), false);

    assert.deepEqual(
      getConvocatoriaGenerations(ADL_TENANT_ID),
      PLATFORM_CONVOCATORIA_GENERATIONS
    );
    assert.equal(
      getConvocatoriaGenerations(ADL_TENANT_ID).some((g) => g.value.startsWith("G-20")),
      false
    );

    const admission = createEmptyAdmissionConfig(ADL_TENANT_ID);
    assert.equal(containsSemMarker(JSON.stringify(admission)), false);
    assert.equal(shouldUseHomeDemoContent("/", ADL_TENANT_ID), false);

    const footer = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: ADL_TENANT_ID,
    });
    assert.equal(footer.cta.title, "");
    assert.equal(containsSemMarker(JSON.stringify(footer)), false);
  });

  it("provision genérico no menciona clientes; migración 012 separada del pack SEM", () => {
    const provision = readSrc("src/core/tenant/provision.ts");
    assert.equal(/adl/i.test(provision), false);
    assert.equal(/seminario/i.test(provision), false);
    assert.match(provision, /export async function provisionTenantFoundation/);

    const registry = readSrc("src/core/migrations/registry.ts");
    assert.match(registry, /012-saas-adl-tenant/);
    assert.match(registry, /010-saas-sem-content/);

    const storage = readSrc("src/lib/cms/storage-config.ts");
    assert.match(storage, /Documento propio del tenant/);
    assert.match(storage, /mode: "local"/);
  });

  it("código runtime: sin if (tenant === adl), rutas ADL ni isAdlTenant", () => {
    const srcRoot = resolve(process.cwd(), "src");
    const files = walkTsFiles(srcRoot);
    const branch = /isAdlTenant|tenant(?:Id)?\s*===?\s*["']adl["']|===\s*ADL_TENANT_ID/;
    const hits: string[] = [];

    for (const full of files) {
      const rel = full
        .slice(resolve(process.cwd()).length + 1)
        .replaceAll("\\", "/");
      if (ADL_RUNTIME_ALLOWLIST.has(rel)) continue;
      const text = readFileSync(full, "utf8");
      if (branch.test(text)) hits.push(rel);
    }

    assert.deepEqual(hits, []);

    const appAdl = resolve(process.cwd(), "src/app/adl");
    const appSiteAdl = resolve(process.cwd(), "src/app/(site)/adl");
    assert.equal(existsSync(appAdl), false);
    assert.equal(existsSync(appSiteAdl), false);

    for (const surface of ["src/app", "src/components", "src/lib"]) {
      const surfaceFiles = walkTsFiles(resolve(process.cwd(), surface));
      for (const full of surfaceFiles) {
        const text = readFileSync(full, "utf8");
        assert.equal(
          text.includes("ADL_TENANT_ID"),
          false,
          `runtime ${full} no debe importar ADL_TENANT_ID`
        );
      }
    }
  });
});

describe("OT-GROWTH-SAAS-009 — coexistencia Mongo T001 + T002", () => {
  it("bootstrap T002 es idempotente y no contamina SEM", async () => {
    await withDb(async (db) => {
      const first = await ensureAdlTenantFoundation(db);
      const second = await ensureAdlTenantFoundation(db);

      assert.equal(first.tenantId, ADL_TENANT_ID);
      assert.equal(first.siteId, ADL_SITE_ID);
      assert.ok(first.hosts.includes(ADL_DEV_HOST_DEFAULT));
      assert.equal(second.created.tenant, false);
      assert.equal(second.created.site, false);
      assert.equal(second.created.siteConfig, false);
      assert.equal(second.created.homePage, false);
      assert.ok(second.skipped.menus >= first.created.menus);

      const tenant = await db
        .collection<TenantDocument>(TENANTS_COLLECTION)
        .findOne({ _id: ADL_TENANT_ID });
      assert.ok(tenant);
      assert.equal(tenant.code, ADL_TENANT_CODE);
      assert.equal(tenant.type, "academy");

      const sem = await db
        .collection<TenantDocument>(TENANTS_COLLECTION)
        .findOne({ _id: SEM_TENANT_ID });
      assert.ok(sem, "T001 debe seguir existiendo");
      assert.equal(sem.code, SEM_TENANT_CODE);

      const adlConfig = await db
        .collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION)
        .findOne({ _id: ADL_SITE_ID, tenantId: ADL_TENANT_ID });
      assert.ok(adlConfig);
      const institution = adlConfig.institution as { name?: string; tenant?: string };
      assert.equal(institution.name, "Academia ADL");
      assert.equal(institution.tenant, ADL_TENANT_ID);
      assert.equal(containsSemMarker(JSON.stringify(adlConfig)), false);

      const semConfig = await db
        .collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION)
        .findOne({ _id: SEM_SITE_ID, tenantId: SEM_TENANT_ID });
      assert.ok(semConfig);
      assert.notEqual(
        (semConfig.institution as { name?: string }).name,
        "Academia ADL"
      );
    });
  });

  it("hosts: SEM→T001, ADL→T002, desconocido no cae a ninguno", async () => {
    await withDb(async (db) => {
      await ensureAdlTenantFoundation(db);

      const adl = await resolvePublicTenantByHost(ADL_DEV_HOST_DEFAULT, { db });
      assert.equal(adl.ok, true);
      if (adl.ok) {
        assert.equal(adl.tenantId, ADL_TENANT_ID);
        assert.equal(adl.siteId, ADL_SITE_ID);
        assert.equal(adl.source, "domain");
        assert.equal(adl.config.institution.name, "Academia ADL");
        assert.equal(adl.config.branding.primaryColor, ADL_SITE_IDENTITY.branding.primaryColor);
        assert.equal(isHostResolutionPortalActive(adl), true);
      }

      const semDomain = await db.collection<DomainDocument>(DOMAINS_COLLECTION).findOne({
        tenantId: SEM_TENANT_ID,
      });
      const semHost = semDomain?.host ?? "localhost:3000";
      const sem = await resolvePublicTenantByHost(semHost, { db });
      assert.equal(sem.ok, true);
      if (sem.ok) {
        assert.equal(sem.tenantId, SEM_TENANT_ID);
        assert.equal(sem.siteId, SEM_SITE_ID);
        assert.notEqual(sem.config.institution.name, "Academia ADL");
      }

      const unknown = await resolvePublicTenantByHost("unknown-saas009.example.test", {
        db,
      });
      assert.equal(unknown.ok, false);
      if (!unknown.ok) {
        assert.equal(unknown.reason, "unknown_host");
      }
    });
  });

  it("aislamiento: datos, IDs lógicos, storage y desactivar T002 no toca T001", async () => {
    await withDb(async (db) => {
      await ensureAdlTenantFoundation(db);

      const formsAdl = await db
        .collection("experience_forms")
        .countDocuments({ tenant: ADL_TENANT_ID });
      assert.equal(formsAdl, 0);

      const admissionAdl = await db.collection("portal_admission_config").findOne({
        tenant: ADL_TENANT_ID,
      });
      assert.equal(admissionAdl, null);

      const programsAdl = await db
        .collection("academy_programs")
        .countDocuments({ tenant: ADL_TENANT_ID });
      const newsAdl = await db
        .collection("content_news")
        .countDocuments({ tenant: ADL_TENANT_ID });
      assert.equal(programsAdl, 0);
      assert.equal(newsAdl, 0);

      const menuMainAdl = scopedResourceId(ADL_TENANT_ID, "main");
      const menuMainSem = scopedResourceId(SEM_TENANT_ID, "main");
      assert.notEqual(menuMainAdl, menuMainSem);
      const menus = db.collection<StringIdDoc>("cms_menus");
      const adlMain = await menus.findOne({
        _id: { $in: [menuMainAdl, "main"] },
        tenant: ADL_TENANT_ID,
      });
      const semMain = await menus.findOne({
        _id: { $in: [menuMainSem, "main"] },
        tenant: SEM_TENANT_ID,
      });
      assert.ok(adlMain);
      assert.ok(semMain);
      assert.equal(await menus.findOne({ _id: menuMainAdl, tenant: SEM_TENANT_ID }), null);
      assert.equal(containsSemMarker(JSON.stringify(adlMain)), false);
      assert.equal(logicalResourceId(ADL_TENANT_ID, menuMainAdl), "main");
      assert.equal(logicalResourceId(SEM_TENANT_ID, menuMainSem), "main");

      const homeAdl = scopedResourceId(ADL_TENANT_ID, "home");
      const homeSem = scopedResourceId(SEM_TENANT_ID, "home");
      const pages = db.collection<StringIdDoc>("cms_pages");
      const adlHome = await pages.findOne({ _id: homeAdl, tenant: ADL_TENANT_ID });
      assert.ok(adlHome);
      assert.equal(adlHome.slug, "/");
      assert.equal(await pages.findOne({ _id: homeAdl, tenant: SEM_TENANT_ID }), null);
      assert.notEqual(homeAdl, homeSem);

      const storageAdl = storageIntegrationIdForTenant(ADL_TENANT_ID);
      const storageSem = storageIntegrationIdForTenant(SEM_TENANT_ID);
      const integrations = db.collection<StringIdDoc>("platform_integrations");
      const adlStorage = await integrations.findOne({
        _id: storageAdl,
        tenantId: ADL_TENANT_ID,
      });
      assert.ok(adlStorage);
      assert.equal(adlStorage.enabled, false);
      assert.equal(
        await integrations.findOne({ _id: storageAdl, tenantId: SEM_TENANT_ID }),
        null
      );
      assert.notEqual(storageAdl, storageSem);

      const tenants = db.collection<TenantDocument>(TENANTS_COLLECTION);
      const original = await tenants.findOne({ _id: ADL_TENANT_ID });
      assert.ok(original);
      try {
        await tenants.updateOne(
          { _id: ADL_TENANT_ID },
          { $set: { status: "inactive", updatedAt: new Date().toISOString() } }
        );
        const inactive = await resolvePublicTenantByHost(ADL_DEV_HOST_DEFAULT, { db });
        assert.equal(inactive.ok, true);
        if (inactive.ok) {
          assert.equal(inactive.tenantId, ADL_TENANT_ID);
          assert.equal(inactive.tenantActive, false);
          assert.equal(isHostResolutionPortalActive(inactive), false);
        }
        const semStill = await resolvePublicTenantByHost("localhost:3000", { db });
        assert.equal(semStill.ok, true);
        if (semStill.ok) {
          assert.equal(semStill.tenantId, SEM_TENANT_ID);
        }
      } finally {
        await tenants.updateOne(
          { _id: ADL_TENANT_ID },
          { $set: { status: original.status, updatedAt: original.updatedAt } }
        );
      }
    });
  });

  it("cuenta con membresía en ambos cambia SEM ↔ ADL y permisos siguen el Espacio activo", async () => {
    await withDb(async (db) => {
      await ensureAdlTenantFoundation(db);

      const memberships = db.collection<StringIdDoc>("identity_memberships");
      const users = db.collection<StringIdDoc>("identity_users");
      const now = new Date().toISOString();

      await memberships.deleteMany({ userId: FIX_USER });
      await users.deleteMany({ _id: FIX_USER });

      await users.insertOne({
        _id: FIX_USER,
        email: "saas009-switch@example.test",
        emailVerified: true,
        displayName: "SAAS-009 Switch",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

      const semRole = roleIdForTenant(SEM_TENANT_ID, ROLE_CODES.SUPER_ADMIN);
      const adlGuest = roleIdForTenant(ADL_TENANT_ID, ROLE_CODES.GUEST);

      await memberships.insertMany([
        {
          _id: `membership-${SEM_TENANT_ID}-${FIX_USER}`,
          tenantId: SEM_TENANT_ID,
          userId: FIX_USER,
          roleIds: [semRole],
          status: "active",
          joinedAt: "2026-01-01T00:00:00.000Z",
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: `membership-${ADL_TENANT_ID}-${FIX_USER}`,
          tenantId: ADL_TENANT_ID,
          userId: FIX_USER,
          roleIds: [adlGuest],
          status: "active",
          joinedAt: "2026-09-04T00:00:00.000Z",
          createdAt: now,
          updatedAt: now,
        },
      ]);

      try {
        const both = [
          { tenantId: SEM_TENANT_ID, joinedAt: "2026-01-01T00:00:00.000Z" },
          { tenantId: ADL_TENANT_ID, joinedAt: "2026-09-04T00:00:00.000Z" },
        ];
        assert.equal(pickActiveTenantId(both, SEM_TENANT_ID), SEM_TENANT_ID);
        assert.equal(pickActiveTenantId(both, ADL_TENANT_ID), ADL_TENANT_ID);
        assert.equal(pickActiveTenantId(both), SEM_TENANT_ID);

        const activeSem = await memberships.findOne({
          userId: FIX_USER,
          tenantId: pickActiveTenantId(both, SEM_TENANT_ID)!,
          status: "active",
        });
        const activeAdl = await memberships.findOne({
          userId: FIX_USER,
          tenantId: pickActiveTenantId(both, ADL_TENANT_ID)!,
          status: "active",
        });
        assert.ok(activeSem);
        assert.ok(activeAdl);
        assert.deepEqual(activeSem.roleIds, [semRole]);
        assert.deepEqual(activeAdl.roleIds, [adlGuest]);
        assert.notDeepEqual(activeSem.roleIds, activeAdl.roleIds);

        const spoof = await memberships.findOne({
          userId: "user-no-existe",
          tenantId: ADL_TENANT_ID,
          status: "active",
        });
        assert.equal(spoof, null);
      } finally {
        await memberships.deleteMany({ userId: FIX_USER });
        await users.deleteMany({ _id: FIX_USER });
      }
    });
  });

  it("migración 012 es idempotente", async () => {
    await withDb(async (db) => {
      const first = await migration012SaasAdlTenant.run({
        db,
        log: () => undefined,
      });
      const second = await migration012SaasAdlTenant.run({
        db,
        log: () => undefined,
      });
      assert.ok(first.details?.length);
      assert.ok(second.details?.length);
      const tenant = await db
        .collection<TenantDocument>(TENANTS_COLLECTION)
        .findOne({ _id: ADL_TENANT_ID });
      assert.ok(tenant);
    });
  });
});
