/**
 * OT-GROWTH-SEM-LEGACY-FIX-001 — eliminar defaults globales heredados de SEM.
 * Hallazgos B: metadata login, updateSiteConfig, MenuListClient, plantillas, EMAIL_FROM.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";

import { PLATFORM_DISPLAY_NAME } from "@/core/branding/display";
import { ADL_TENANT_ID, SEM_TENANT_ID } from "@/core/tenant/constants";
import { buildDefaultFormExperience } from "@/lib/cms/form-experience-defaults";
import {
  getDefaultMenusForTenant,
  PLATFORM_DEFAULT_MENUS,
  SEM_DEFAULT_MENUS,
} from "@/lib/cms/menu-defaults";
import { resolveEmailIdentity } from "@/lib/notifications/identity";
import {
  formatFromHeader,
  parseTechnicalMailbox,
} from "@/lib/notifications/transport";
import { createDefaultSiteConfig } from "@/lib/cms/defaults";
import { applySemSiteIdentity } from "@/core/tenant/sem-site-identity";
import { applyAdlSiteIdentity } from "@/core/tenant/adl-site-identity";

const ROOT = resolve(process.cwd());

function readSrc(rel: string) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("OT-GROWTH-SEM-LEGACY-FIX-001 — defaults globales SEM", () => {
  it("A. /admin/login declara metadata Growth OS (no SEO del Espacio)", () => {
    const login = readSrc("src/app/admin/login/page.tsx");
    assert.match(login, /export const metadata/);
    assert.match(login, /PLATFORM_DISPLAY_NAME/);
    assert.match(login, /title:\s*PLATFORM_DISPLAY_NAME/);
    assert.doesNotMatch(login, /getSiteMetadata|getSiteConfig|seo\.title/);
    assert.equal(PLATFORM_DISPLAY_NAME, "Growth OS");
  });

  it("E. updateSiteConfig exige tenantId; sin fallback silencioso a SEM", () => {
    const config = readSrc("src/lib/cms/config.ts");
    assert.match(
      config,
      /updateSiteConfig\(\s*update:\s*SiteConfigUpdate,\s*options:\s*\{\s*tenantId:\s*string\s*\}/
    );
    assert.match(config, /if\s*\(\s*!tenantId\s*\)\s*\{\s*return null/);
    assert.doesNotMatch(
      config,
      /effectiveTenant[\s\S]{0,80}SEM_TENANT_ID/
    );
    assert.doesNotMatch(
      config,
      /tenantId\s*\|\|\s*existing\.institution\.tenant[\s\S]{0,40}SEM_TENANT_ID/
    );
  });

  it("F. MenuListClient default = PLATFORM_DEFAULT_MENUS; SEM solo vía getDefaultMenusForTenant", () => {
    const client = readSrc("src/components/menu/MenuListClient.tsx");
    const menusPage = readSrc("src/app/admin/menus/page.tsx");
    assert.match(client, /PLATFORM_DEFAULT_MENUS/);
    assert.match(client, /seedMenus\s*=\s*PLATFORM_DEFAULT_MENUS/);
    assert.doesNotMatch(client, /import\s*\{\s*DEFAULT_MENUS/);
    assert.doesNotMatch(client, /SEM_DEFAULT_MENUS/);
    assert.doesNotMatch(client, /seedMenus\s*=\s*DEFAULT_MENUS/);
    assert.match(menusPage, /getDefaultMenusForTenant/);
    assert.equal(getDefaultMenusForTenant(SEM_TENANT_ID), SEM_DEFAULT_MENUS);
    assert.equal(getDefaultMenusForTenant(ADL_TENANT_ID), PLATFORM_DEFAULT_MENUS);
    assert.equal(getDefaultMenusForTenant("otro-espacio"), PLATFORM_DEFAULT_MENUS);
  });

  it("F. plantillas form-experience: copy SEM solo si isSemTenant", () => {
    const defaults = readSrc("src/lib/cms/form-experience-defaults.ts");
    assert.match(defaults, /isSemTenant\(tenant\)/);

    const sem = buildDefaultFormExperience(
      SEM_TENANT_ID,
      "program-application",
      "Postulación"
    );
    assert.match(sem.footer.copyright ?? "", /Seminario Eclesiástico Mayor/);
    assert.equal(sem.footer.contactEmail, "contacto@sem.cl");
    assert.match(sem.hero.subheadline, /Seminario Eclesiástico Mayor/);

    const adl = buildDefaultFormExperience(
      ADL_TENANT_ID,
      "program-application",
      "Postulación"
    );
    assert.doesNotMatch(JSON.stringify(adl), /Seminario Eclesiástico Mayor|contacto@sem\.cl/);
    assert.equal(adl.footer.enabled, false);

    const other = buildDefaultFormExperience("espacio-x", "form-gen", "Genérico");
    assert.equal(other.footer.enabled, false);
    assert.doesNotMatch(
      JSON.stringify(other.footer),
      /sem\.cl|Seminario Eclesiástico Mayor/i
    );
  });

  it("EMAIL_FROM: display name = Espacio o Growth OS; nunca Portal SEM del env", () => {
    assert.equal(
      parseTechnicalMailbox("Portal SEM <noreply@growth.example>"),
      "noreply@growth.example"
    );

    const platform = resolveEmailIdentity({});
    assert.equal(platform.displayName, PLATFORM_DISPLAY_NAME);

    const semConfig = applySemSiteIdentity(createDefaultSiteConfig());
    const sem = resolveEmailIdentity({
      config: semConfig,
      tenantId: SEM_TENANT_ID,
    });
    assert.match(sem.displayName, /Seminario Eclesiástico Mayor/);
    assert.doesNotMatch(sem.displayName, /Portal SEM|Growth OS/);

    const adlConfig = applyAdlSiteIdentity(createDefaultSiteConfig());
    const adl = resolveEmailIdentity({
      config: adlConfig,
      tenantId: ADL_TENANT_ID,
    });
    assert.match(adl.displayName, /Academia ADL/);
    assert.doesNotMatch(adl.displayName, /Portal SEM|Seminario/);

    const from = formatFromHeader(platform.displayName, "noreply@growth.example");
    assert.match(from, /Growth OS/);
    assert.doesNotMatch(from, /Portal SEM/);

    const identitySrc = readSrc("src/lib/notifications/identity.ts");
    assert.doesNotMatch(identitySrc, /process\.env\.EMAIL_FROM|env\.EMAIL_FROM/);
  });
});
