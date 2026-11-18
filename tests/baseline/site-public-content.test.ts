import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import {
  isPublicContentTenantId,
  publicSiteContentFromConfig,
} from "../../src/sites/content/public";
import { clearCodedSites, getCodedSite } from "../../src/sites/registry";
import { ensureProductionCodedSites } from "../../src/sites/production";
import { CUMPLE_TENANT_ID } from "../../src/sites/cumple/site";

function readSrc(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("contenido público para sitios conectados", () => {
  afterEach(() => {
    clearCodedSites();
  });

  it("acepta slugs de espacio y rechaza basura", () => {
    assert.equal(isPublicContentTenantId("adl"), true);
    assert.equal(isPublicContentTenantId("mentor-prime-capacitacion"), true);
    assert.equal(isPublicContentTenantId("cumple"), true);
    assert.equal(isPublicContentTenantId("../etc/passwd"), false);
    assert.equal(isPublicContentTenantId("adl/admin"), false);
    assert.equal(isPublicContentTenantId(""), false);
  });

  it("expone solo contacto, redes e imágenes", () => {
    const config = createDefaultSiteConfig();
    config.institution.tenant = "adl";
    config.institution.name = "Academia ADL";
    config.contact.email = "hola@adl.cl";
    config.contact.phone = "+56 9 1111 1111";
    const payload = publicSiteContentFromConfig(config, {
      logo: "https://cdn.example/logo.png",
      hero: "/fotos/portada.jpg",
    });
    assert.equal(payload.tenantId, "adl");
    assert.equal(payload.contact.email, "hola@adl.cl");
    assert.equal(payload.contact.phone, "+56 9 1111 1111");
    assert.equal(payload.images.logo, "https://cdn.example/logo.png");
    assert.equal("sitePublished" in payload, false);
    assert.equal("modules" in payload, false);
  });

  it("la identidad visual incluye logo y foto de portada", () => {
    const branding = readSrc("src/components/config/BrandingPanel.tsx");
    assert.match(branding, /LogoUploader/);
    assert.match(branding, /HeroUploader/);
    assert.match(branding, /heroMediaId/);
  });

  it("la API pública vive en /api/site/public-content y permite CORS", () => {
    const route = readSrc("src/app/api/site/public-content/route.ts");
    const cors = readSrc("src/sites/content/public.ts");
    assert.match(route, /getSiteConfigForTenant/);
    assert.match(route, /PUBLIC_CONTENT_CORS/);
    assert.match(route, /publicSiteContentFromConfig/);
    assert.doesNotMatch(route, /requirePermission/);
    assert.match(cors, /Access-Control-Allow-Origin/);
  });

  it("producción no sirve Formación ni ADL desde Growth OS", () => {
    ensureProductionCodedSites();
    assert.equal(getCodedSite(CUMPLE_TENANT_ID)?.tenantId, "cumple");
    assert.equal(getCodedSite("mentor-prime-capacitacion"), undefined);
    assert.equal(getCodedSite("adl"), undefined);
    const production = readSrc("src/sites/production.ts");
    assert.doesNotMatch(production, /formacionSite/);
    assert.doesNotMatch(production, /adlSite/);
  });
});
