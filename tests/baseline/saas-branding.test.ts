/**
 * OT-GROWTH-SAAS-006 — branding por Site/Espacio.
 * T001 conserva SEM porque está en site_config, no por fallbacks de runtime.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, type Db } from "mongodb";
import {
  ADL_SITE_ID,
  ADL_TENANT_ID,
  SEM_SITE_ID,
  SEM_TENANT_ID,
  SITE_CONFIG_COLLECTION,
} from "../../src/core/tenant/constants";
import {
  applySemSiteIdentity,
  configLooksLikeSemIdentity,
  SEM_SITE_IDENTITY,
} from "../../src/core/tenant/sem-site-identity";
import { ADL_SITE_IDENTITY } from "../../src/core/tenant/adl-site-identity";
import { buildBrandThemeStyle } from "../../src/core/branding/theme";
import {
  seoDescriptionFromConfig,
  seoTitleFromConfig,
} from "../../src/core/branding/display";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import {
  adlSiteBrandColors,
  colorDefaults,
  semSiteBrandColors,
} from "../../src/design/tokens/colors";
import { loadEnvLocal } from "../../src/core/migrations/env";
import type { SiteConfigDocument } from "../../src/core/tenant/types";

const FIX_TENANT = "tenant-saas006";
const FIX_SITE = "tenant-saas006";
/** Fixture solo para prueba de aislamiento — nunca SEM/ADL productivos. */
const FIX_ISOLATION_TENANT = "tenant-identity-mt-001";
const FIX_ISOLATION_SITE = "tenant-identity-mt-001";
const FIX_TEMP_PRIMARY = "#c0ffee";
const SEM_MARKERS = [
  "Seminario Eclesiástico Mayor",
  "seminarioipn",
  "logo-sem",
  "logo-ipn",
  "contacto@seminarioipn",
];

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

describe("OT-GROWTH-SAAS-006 — plantilla y T001", () => {
  it("createDefaultSiteConfig no trae identidad SEM", () => {
    const defaults = createDefaultSiteConfig();
    assert.equal(defaults.institution.name, "");
    assert.equal(defaults.institution.shortName, "");
    assert.equal(defaults.branding.logo, "");
    assert.equal(defaults.branding.favicon, "");
    assert.equal(defaults.contact.email, "");
    assert.equal(defaults.social.facebook, "");
    assert.equal(defaults.seo.title, "");
    assert.equal(configLooksLikeSemIdentity(defaults), false);
    const identitySlice = JSON.stringify({
      institution: defaults.institution,
      branding: {
        logo: defaults.branding.logo,
        secondaryLogo: defaults.branding.secondaryLogo,
        favicon: defaults.branding.favicon,
      },
      seo: defaults.seo,
      contact: defaults.contact,
      social: defaults.social,
      topBar: { email: defaults.topBar.email, phone: defaults.topBar.phone },
    });
    assert.equal(containsSemMarker(identitySlice), false);
  });

  it("T001 vacío se materializa con identidad SEM; valores existentes no se pisan", () => {
    const empty = createDefaultSiteConfig();
    const filled = applySemSiteIdentity(empty);
    assert.equal(filled.institution.name, SEM_SITE_IDENTITY.institution.name);
    assert.equal(filled.branding.logo, SEM_SITE_IDENTITY.branding.logo);
    assert.equal(filled.contact.email, SEM_SITE_IDENTITY.contact.email);
    assert.equal(configLooksLikeSemIdentity(filled), true);

    const custom = createDefaultSiteConfig();
    custom.institution.name = "Academia Norte";
    custom.branding.logo = "/images/logo-norte.png";
    custom.branding.primaryColor = "#11aa22";
    custom.seo.title = "Academia Norte";
    const kept = applySemSiteIdentity(custom);
    assert.equal(kept.institution.name, "Academia Norte");
    assert.equal(kept.branding.logo, "/images/logo-norte.png");
    assert.equal(kept.branding.primaryColor, "#11aa22");
    assert.equal(kept.seo.title, "Academia Norte");
  });

  it("Theme y SEO siguen el Site; vacío no se convierte en SEM", async () => {
    const testSite = createDefaultSiteConfig();
    testSite.institution.name = "Campus Demo";
    testSite.institution.shortName = "CD";
    testSite.branding.logo = "/images/logo-demo.png";
    testSite.branding.primaryColor = "#ff5500";
    testSite.branding.secondaryColor = "#003366";
    testSite.seo.title = "Campus Demo — Portal";
    testSite.seo.description = "Sitio de prueba";

    const theme = buildBrandThemeStyle(testSite.branding);
    assert.equal(theme?.["--brand-primary"], "#ff5500");
    assert.equal(theme?.["--brand-secondary"], "#003366");

    assert.equal(seoTitleFromConfig(testSite), "Campus Demo — Portal");
    assert.equal(containsSemMarker(seoTitleFromConfig(testSite)), false);
    assert.equal(seoDescriptionFromConfig(testSite), "Sitio de prueba");
    assert.equal(containsSemMarker(seoDescriptionFromConfig(testSite) ?? ""), false);

    const empty = createDefaultSiteConfig();
    assert.equal(seoTitleFromConfig(empty), "Growth OS");
    assert.equal(containsSemMarker(seoTitleFromConfig(empty)), false);
    assert.notEqual(seoTitleFromConfig(empty), SEM_SITE_IDENTITY.seo.title);

    const semConfig = applySemSiteIdentity(createDefaultSiteConfig());
    assert.equal(seoTitleFromConfig(semConfig), SEM_SITE_IDENTITY.seo.title);

    assert.equal(testSite.branding.logo, "/images/logo-demo.png");
    assert.equal(createDefaultSiteConfig().branding.logo, "");
  });
});

describe("OT-GROWTH-SAAS-006 — runtime sin fallbacks SEM", () => {
  it("helpers y chrome no reinyectan SEM cuando falta branding", () => {
    const brandMark = readSrc("src/components/portal/PortalBrandMark.tsx");
    assert.doesNotMatch(brandMark, /logo-sem/);
    assert.doesNotMatch(brandMark, /Seminario Eclesiástico Mayor/);
    assert.doesNotMatch(brandMark, /PLATFORM_ASSET_FALLBACKS/);

    const defaults = readSrc("src/lib/cms/defaults.ts");
    assert.doesNotMatch(defaults, /seminarioipn/);
    assert.doesNotMatch(defaults, /logo-sem/);
    assert.doesNotMatch(defaults, /Seminario Eclesiástico Mayor/);

    const layout = readSrc("src/app/layout.tsx");
    assert.match(layout, /buildBrandThemeStyle/);
    assert.match(layout, /getTenantContext/);

    const identity = readSrc("src/core/tenant/sem-site-identity.ts");
    assert.match(identity, /SEM_SITE_IDENTITY/);
    assert.match(identity, /applySemSiteIdentity/);
  });
});

describe("OT-GROWTH-IDENTITY-MT-001 — Master ≠ Espacio", () => {
  it("primarios Master, SEM y ADL son distintos; theme sigue site_config", () => {
    assert.notEqual(colorDefaults.primary.toLowerCase(), semSiteBrandColors.primary.toLowerCase());
    assert.notEqual(colorDefaults.primary.toLowerCase(), adlSiteBrandColors.primary.toLowerCase());
    assert.notEqual(
      semSiteBrandColors.primary.toLowerCase(),
      adlSiteBrandColors.primary.toLowerCase()
    );

    const masterTheme = buildBrandThemeStyle({
      primaryColor: colorDefaults.primary,
      secondaryColor: colorDefaults.secondary,
      backgroundColor: colorDefaults.background,
      textColor: colorDefaults.foreground,
    });
    const semTheme = buildBrandThemeStyle(SEM_SITE_IDENTITY.branding);
    const adlTheme = buildBrandThemeStyle(ADL_SITE_IDENTITY.branding);
    assert.ok(masterTheme && semTheme && adlTheme);
    assert.notEqual(masterTheme["--brand-primary"], semTheme["--brand-primary"]);
    assert.notEqual(masterTheme["--brand-primary"], adlTheme["--brand-primary"]);
    assert.notEqual(semTheme["--brand-primary"], adlTheme["--brand-primary"]);
  });

  it("/platform aísla Master; /admin edita site_config vía BrandingPanel", () => {
    const neutral = readSrc("src/components/product/PlatformNeutralTheme.tsx");
    const platformShell = readSrc("src/components/platform/PlatformShell.tsx");
    const brandCss = readSrc("src/styles/tokens/brand.css");
    const panel = readSrc("src/components/config/BrandingPanel.tsx");
    const hub = readSrc("src/components/config/ConfigurationHub.tsx");
    const api = readSrc("src/app/api/cms/config/route.ts");

    assert.match(brandCss, /--growth-os-primary/);
    assert.match(neutral, /growth-os-primary/);
    assert.match(neutral, /data-theme-scope="growth-os"/);
    assert.match(platformShell, /PlatformNeutralTheme/);
    assert.match(panel, /primaryColor/);
    assert.match(panel, /secondaryColor/);
    assert.match(hub, /BrandingPanel/);
    assert.match(hub, /activeSection === "branding"/);
    assert.match(api, /settings\.update/);
    assert.match(api, /tenantId: ctx\.tenantId/);
  });
});

describe("OT-GROWTH-SAAS-006 — fixture Mongo aislado", () => {
  it("un Site de prueba no hereda branding SEM; T001 permanece", async () => {
    await withDb(async (db) => {
      const siteConfig = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);
      const at = new Date().toISOString();
      const base = createDefaultSiteConfig();

      await siteConfig.deleteMany({ tenantId: FIX_TENANT });
      await siteConfig.insertOne({
        _id: FIX_SITE,
        tenantId: FIX_TENANT,
        siteId: FIX_SITE,
        schemaVersion: base.schemaVersion,
        modules: base.modules,
        institution: {
          ...base.institution,
          name: "Campus Demo",
          shortName: "CD",
          tenant: FIX_TENANT,
        },
        branding: {
          ...base.branding,
          logo: "/images/logo-demo.png",
          primaryColor: "#ff5500",
        },
        seo: { title: "Campus Demo", description: "No SEM", keywords: [] },
        contact: base.contact,
        social: base.social,
        features: base.features,
        portalCopy: base.portalCopy,
        topBar: base.topBar,
        portalExperience: base.portalExperience,
        createdAt: at,
        updatedAt: at,
      });

      const demo = await siteConfig.findOne({ _id: FIX_SITE, tenantId: FIX_TENANT });
      assert.ok(demo);
      const demoName = (demo.institution as { name?: string }).name;
      const demoLogo = (demo.branding as { logo?: string }).logo;
      assert.equal(demoName, "Campus Demo");
      assert.equal(demoLogo, "/images/logo-demo.png");
      assert.equal(containsSemMarker(JSON.stringify(demo.institution)), false);

      const sem = await siteConfig.findOne({
        $or: [{ _id: SEM_SITE_ID }, { siteId: SEM_SITE_ID, tenantId: SEM_TENANT_ID }],
      });
      if (sem) {
        assert.equal(sem.tenantId, SEM_TENANT_ID);
        const semName = (sem.institution as { name?: string }).name ?? "";
        if (semName) {
          assert.equal(semName, SEM_SITE_IDENTITY.institution.name);
        }
      }

      await siteConfig.deleteMany({ tenantId: FIX_TENANT });
    });
  });

  it("cambio temporal de color en fixture no altera SEM, ADL ni Master", async () => {
    await withDb(async (db) => {
      const siteConfig = db.collection<SiteConfigDocument>(SITE_CONFIG_COLLECTION);
      const at = new Date().toISOString();
      const base = createDefaultSiteConfig();

      const semBefore = await siteConfig.findOne({
        $or: [{ _id: SEM_SITE_ID }, { siteId: SEM_SITE_ID, tenantId: SEM_TENANT_ID }],
      });
      const adlBefore = await siteConfig.findOne({
        $or: [{ _id: ADL_SITE_ID }, { siteId: ADL_SITE_ID, tenantId: ADL_TENANT_ID }],
      });
      const semPrimaryBefore = (semBefore?.branding as { primaryColor?: string } | undefined)
        ?.primaryColor;
      const adlPrimaryBefore = (adlBefore?.branding as { primaryColor?: string } | undefined)
        ?.primaryColor;

      await siteConfig.deleteMany({ tenantId: FIX_ISOLATION_TENANT });
      await siteConfig.insertOne({
        _id: FIX_ISOLATION_SITE,
        tenantId: FIX_ISOLATION_TENANT,
        siteId: FIX_ISOLATION_SITE,
        schemaVersion: base.schemaVersion,
        modules: base.modules,
        institution: {
          ...base.institution,
          name: "Fixture Identity MT",
          shortName: "FIX",
          tenant: FIX_ISOLATION_TENANT,
        },
        branding: {
          ...base.branding,
          primaryColor: "#112233",
          secondaryColor: "#445566",
        },
        seo: { title: "Fixture", description: "isolation", keywords: [] },
        contact: base.contact,
        social: base.social,
        features: base.features,
        portalCopy: base.portalCopy,
        topBar: base.topBar,
        portalExperience: base.portalExperience,
        createdAt: at,
        updatedAt: at,
      });

      await siteConfig.updateOne(
        { _id: FIX_ISOLATION_SITE, tenantId: FIX_ISOLATION_TENANT },
        { $set: { "branding.primaryColor": FIX_TEMP_PRIMARY, updatedAt: new Date().toISOString() } }
      );

      const fixture = await siteConfig.findOne({
        _id: FIX_ISOLATION_SITE,
        tenantId: FIX_ISOLATION_TENANT,
      });
      assert.ok(fixture);
      assert.equal(
        (fixture.branding as { primaryColor?: string }).primaryColor?.toLowerCase(),
        FIX_TEMP_PRIMARY.toLowerCase()
      );

      const theme = buildBrandThemeStyle(fixture.branding as {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
      });
      assert.equal(theme?.["--brand-primary"]?.toLowerCase(), FIX_TEMP_PRIMARY.toLowerCase());
      assert.notEqual(theme?.["--brand-primary"]?.toLowerCase(), colorDefaults.primary.toLowerCase());
      assert.notEqual(
        theme?.["--brand-primary"]?.toLowerCase(),
        semSiteBrandColors.primary.toLowerCase()
      );
      assert.notEqual(
        theme?.["--brand-primary"]?.toLowerCase(),
        adlSiteBrandColors.primary.toLowerCase()
      );

      const semAfter = await siteConfig.findOne({
        $or: [{ _id: SEM_SITE_ID }, { siteId: SEM_SITE_ID, tenantId: SEM_TENANT_ID }],
      });
      const adlAfter = await siteConfig.findOne({
        $or: [{ _id: ADL_SITE_ID }, { siteId: ADL_SITE_ID, tenantId: ADL_TENANT_ID }],
      });
      assert.equal(
        (semAfter?.branding as { primaryColor?: string } | undefined)?.primaryColor,
        semPrimaryBefore
      );
      assert.equal(
        (adlAfter?.branding as { primaryColor?: string } | undefined)?.primaryColor,
        adlPrimaryBefore
      );

      await siteConfig.deleteMany({ tenantId: FIX_ISOLATION_TENANT });
      const gone = await siteConfig.findOne({ tenantId: FIX_ISOLATION_TENANT });
      assert.equal(gone, null);
    });
  });
});
