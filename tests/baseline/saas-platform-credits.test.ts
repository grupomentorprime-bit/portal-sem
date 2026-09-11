/**
 * OT-GROWTH-PROD-003 — créditos y defaults de plataforma.
 * Producto = Growth OS; cliente = nombre del Espacio; sin nombre = Growth OS.
 * T001 conserva pack SEM/IPN; adapter Aprende Hoy intacto.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import {
  PLATFORM_CREDITS,
  PLATFORM_DISPLAY_NAME,
  rewriteLegacyPlatformProductName,
} from "../../src/core/branding/display";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "../../src/core/tenant/constants";
import { applyAdlSiteIdentity } from "../../src/core/tenant/adl-site-identity";
import { applySemSiteIdentity, SEM_SITE_IDENTITY } from "../../src/core/tenant/sem-site-identity";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { normalizeSiteConfig } from "../../src/lib/cms/normalize";
import { DEFAULT_ADMISSION_CLOSING } from "../../src/lib/portal/admission-closing-defaults";
import {
  PLATFORM_FOOTER_LEGAL,
  resolveFooterContent,
  SEM_FOOTER_INSTITUTION,
  SEM_FOOTER_LEGAL,
} from "../../src/lib/portal/footer-content";
import type { PortalFooterPremiumViewModel } from "../../src/types/footer-premium";

const ROOT = process.cwd();

const LEGACY_PRODUCT_NAMES = [
  "Portal SEM",
  "Learning OS",
  "AprendeHoy Learning OS",
] as const;

const EXEMPT_SRC = new Set([
  "src/core/branding/display.ts",
  "src/lib/portal/admission-content.ts",
  "src/core/admission/admission-adapter.ts",
]);

const PLATFORM_SURFACE_FILES = [
  "src/lib/cms/defaults.ts",
  "src/lib/cms/normalize.ts",
  "src/lib/portal/footer-content.ts",
  "src/components/config/PortalCopyForm.tsx",
  "src/components/config/HeroPortalPanel.tsx",
  "src/app/internal/layout.tsx",
  "src/app/internal/design-system/page.tsx",
  "src/app/admin/aek/page.tsx",
  "src/components/admin/kit/catalog/AekCatalog.tsx",
  "src/components/design-system/DesignSystemShowcase.tsx",
  "src/components/ui/footer.tsx",
  "src/lib/admin/module-panels.ts",
  "scripts/setup-keycloak-client.ts",
  "scripts/migrate.ts",
  "src/core/migrations/runner.ts",
];

function posixRel(file: string): string {
  return relative(ROOT, file).replace(/\\/g, "/");
}

function readSrc(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function walkFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "dist"
    ) {
      continue;
    }
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
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

function containsLegacyProductName(text: string): string | null {
  for (const marker of LEGACY_PRODUCT_NAMES) {
    if (text.includes(marker)) return marker;
  }
  return null;
}

describe("OT-GROWTH-PROD-003 — helper y defaults", () => {
  it("reescribe nombres de producto heredados; copy propio no se pisa", () => {
    assert.equal(PLATFORM_DISPLAY_NAME, "Growth OS");
    assert.equal(PLATFORM_CREDITS, "Growth OS");
    assert.equal(
      rewriteLegacyPlatformProductName(
        "Desarrollado por Grupo Mentor Prime · Learning OS"
      ),
      "Desarrollado por Grupo Mentor Prime · Growth OS"
    );
    assert.equal(
      rewriteLegacyPlatformProductName("Desarrollado con AprendeHoy Learning OS"),
      "Desarrollado con Growth OS"
    );
    assert.equal(rewriteLegacyPlatformProductName("Portal SEM"), "Growth OS");
    assert.equal(
      rewriteLegacyPlatformProductName("Crédito de Academia Norte"),
      "Crédito de Academia Norte"
    );
    assert.equal(rewriteLegacyPlatformProductName("  "), "");
  });

  it("plantilla de Site acredita Growth OS; no Learning OS ni SEM", () => {
    const defaults = createDefaultSiteConfig();
    assert.equal(defaults.portalCopy.footerCredits, PLATFORM_CREDITS);
    assert.equal(containsLegacyProductName(defaults.portalCopy.footerCredits), null);
    assert.equal(defaults.institution.name, "");
    assert.notEqual(
      defaults.portalCopy.footerCredits,
      SEM_SITE_IDENTITY.institution.name
    );
  });

  it("créditos legado en site_config se normalizan al leer", () => {
    const raw = createDefaultSiteConfig();
    raw.portalCopy.footerCredits =
      "Desarrollado por Grupo Mentor Prime · Learning OS";
    const normalized = normalizeSiteConfig(raw);
    assert.ok(normalized);
    assert.equal(
      normalized.portalCopy.footerCredits,
      "Desarrollado por Grupo Mentor Prime · Growth OS"
    );
    assert.equal(
      containsLegacyProductName(normalized.portalCopy.footerCredits),
      null
    );
  });
});

describe("OT-GROWTH-PROD-003 — SEM conserva pack; ADL no hereda nombres SEM", () => {
  it("T001 sigue siendo Seminario/IPN; crédito de plataforma ya no dice Learning OS", () => {
    const sem = applySemSiteIdentity(createDefaultSiteConfig());
    assert.equal(sem.institution.name, SEM_SITE_IDENTITY.institution.name);
    assert.equal(sem.institution.organization, "IPN");
    assert.match(sem.branding.logo, /logo-sem/);

    assert.equal(
      SEM_FOOTER_INSTITUTION.sealLine3,
      "IGLESIA PENTECOSTAL NAZARETH"
    );
    assert.doesNotMatch(SEM_FOOTER_LEGAL.credits, /Learning OS/);
    assert.match(SEM_FOOTER_LEGAL.credits, /Growth OS/);

    const closingJson = JSON.stringify(DEFAULT_ADMISSION_CLOSING);
    assert.match(closingJson, /Seminario Eclesiástico Mayor/);
    assert.match(closingJson, /IPN Chile/);
    assert.doesNotMatch(closingJson, /Learning OS/);
    assert.match(closingJson, /Growth OS/);

    const semFooter = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: SEM_TENANT_ID,
    });
    assert.equal(
      semFooter.institution.sealLine3,
      SEM_FOOTER_INSTITUTION.sealLine3
    );
    assert.doesNotMatch(semFooter.legal.credits, /Learning OS|Portal SEM/);
    assert.match(semFooter.legal.credits, /Growth OS/);
  });

  it("Espacio vacío / ADL: crédito Growth OS, sin branding ni nombres SEM", () => {
    assert.equal(PLATFORM_FOOTER_LEGAL.credits, PLATFORM_CREDITS);

    const emptyFooter = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: "tenant-prod003",
    });
    assert.equal(emptyFooter.legal.credits, PLATFORM_DISPLAY_NAME);
    assert.equal(emptyFooter.institution.sealLine3, "");
    assert.notEqual(
      emptyFooter.institution.sealLine3,
      SEM_FOOTER_INSTITUTION.sealLine3
    );

    const adl = applyAdlSiteIdentity(createDefaultSiteConfig());
    assert.equal(adl.institution.shortName, "ADL");
    assert.equal(adl.portalCopy.footerCredits, PLATFORM_CREDITS);
    assert.equal(containsLegacyProductName(adl.portalCopy.footerCredits), null);
    assert.doesNotMatch(adl.institution.name, /Seminario|SEM|IPN/i);
    assert.equal(adl.branding.logo, "");

    const adlFooter = resolveFooterContent(emptyFooterViewModel(), {
      tenantId: ADL_TENANT_ID,
    });
    assert.equal(adlFooter.legal.credits, PLATFORM_DISPLAY_NAME);
    assert.equal(adlFooter.cta.title, "");
    assert.doesNotMatch(JSON.stringify(adlFooter), /Seminario Eclesiástico Mayor/);
  });
});

describe("OT-GROWTH-PROD-003 — búsqueda runtime de nombres legacy", () => {
  it("superficies de plataforma no presentan este producto como Learning OS / Portal SEM", () => {
    for (const file of PLATFORM_SURFACE_FILES) {
      const src = readSrc(file);
      for (const marker of LEGACY_PRODUCT_NAMES) {
        assert.equal(
          src.includes(marker),
          false,
          `${file} contiene copy legado: ${marker}`
        );
      }
    }
  });

  it("src/scripts: legacy solo en helper de rewrite, pack T001 y adapter Aprende Hoy", () => {
    const files = [
      ...walkFiles(resolve(ROOT, "src")),
      ...walkFiles(resolve(ROOT, "scripts")),
    ];
    const leaks: string[] = [];

    for (const file of files) {
      const rel = posixRel(file);
      if (EXEMPT_SRC.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      const marker = containsLegacyProductName(src);
      if (marker) leaks.push(`${rel} → ${marker}`);
    }

    assert.deepEqual(leaks, []);
  });

  it("pack T001 y adapter académico conservan Aprende Hoy donde corresponde", () => {
    const admission = readSrc("src/lib/portal/admission-content.ts");
    assert.match(admission, /AprendeHoy Learning OS/);
    assert.match(admission, /Seminario Eclesiástico Mayor|IPN|SEM/);

    const adapter = readSrc("src/core/admission/admission-adapter.ts");
    assert.match(adapter, /AprendeHoyAdmissionAdapter/);
    assert.match(adapter, /AprendeHoy Learning OS/);
  });
});
