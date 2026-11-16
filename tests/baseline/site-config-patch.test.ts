import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { fillBlankSeo, mergeSiteConfigPatch } from "../../src/lib/cms/site-config-patch";
import { presenceConfigPatch } from "../../src/lib/desktop/presence-patch";
import type { SiteConfig } from "../../src/types/cms";

function sample(): SiteConfig {
  const config = createDefaultSiteConfig();
  config.institution = {
    ...config.institution,
    name: "Seminario",
    shortName: "SEM",
    tenant: "seminario-ipn",
    organization: "Iglesia",
    website: "https://ejemplo.cl",
    tagline: "Formar",
    status: "active",
  };
  config.branding = {
    ...config.branding,
    logoMediaId: "media-logo",
    faviconMediaId: "media-favicon",
    primaryColor: "#112233",
  };
  config.seo = {
    title: "Título vigente",
    description: "Descripción vigente",
    keywords: ["seminario"],
    ogImage: "/og.jpg",
  };
  config.contact = { ...config.contact, email: "hola@ejemplo.cl", phone: "+56 9 1111 1111" };
  config.features = { ...config.features, blog: true, news: true };
  config.sitePublished = true;
  config.heroPortal = { ...config.heroPortal, enabled: true };
  return config;
}

describe("guardado parcial de SiteConfig", () => {
  it("Mi empresa solo envía institución y contacto cambiados", () => {
    const baseline = sample();
    const current: SiteConfig = {
      ...baseline,
      institution: { ...baseline.institution, name: "Seminario Mayor" },
      seo: { ...baseline.seo, title: "No debe viajar" },
      branding: { ...baseline.branding, logoMediaId: "media-otro" },
    };
    const patch = presenceConfigPatch("empresa", baseline, current);
    assert.deepEqual(Object.keys(patch).sort(), ["institution"]);
    assert.equal(patch.institution?.name, "Seminario Mayor");
    assert.equal(patch.institution?.shortName, undefined);
    assert.equal("seo" in patch, false);
    assert.equal("branding" in patch, false);
  });

  it("Marca solo envía los campos visuales que cambiaron", () => {
    const baseline = sample();
    const current: SiteConfig = {
      ...baseline,
      branding: { ...baseline.branding, primaryColor: "#AABBCC" },
      heroPortal: { ...baseline.heroPortal, enabled: false },
      seo: { ...baseline.seo, title: "Tampoco" },
    };
    const patch = presenceConfigPatch("marca", baseline, current);
    assert.deepEqual(patch, { branding: { primaryColor: "#AABBCC" } });
  });

  it("combinar el parche conserva SEO, imágenes y publicación más recientes", () => {
    const opened = sample();
    const savedLater: SiteConfig = {
      ...opened,
      seo: { ...opened.seo, title: "SEO recién editado", ogImage: "/og-nuevo.jpg" },
      branding: { ...opened.branding, logoMediaId: "media-logo-nuevo" },
      features: { ...opened.features, library: true },
      sitePublished: false,
      updatedAt: "2026-11-16T04:00:00.000Z",
    };
    const current: SiteConfig = {
      ...opened,
      institution: { ...opened.institution, name: "Nombre desde NELZURI" },
      contact: { ...opened.contact, city: "Santiago" },
    };
    const patch = presenceConfigPatch("empresa", opened, current);
    const merged = fillBlankSeo(mergeSiteConfigPatch(savedLater, patch));

    assert.equal(merged.institution.name, "Nombre desde NELZURI");
    assert.equal(merged.institution.shortName, "SEM");
    assert.equal(merged.contact.city, "Santiago");
    assert.equal(merged.contact.email, "hola@ejemplo.cl");
    assert.equal(merged.seo.title, "SEO recién editado");
    assert.equal(merged.seo.description, "Descripción vigente");
    assert.equal(merged.seo.ogImage, "/og-nuevo.jpg");
    assert.deepEqual(merged.seo.keywords, ["seminario"]);
    assert.equal(merged.branding.logoMediaId, "media-logo-nuevo");
    assert.equal(merged.branding.primaryColor, "#112233");
    assert.equal(merged.features.blog, true);
    assert.equal(merged.features.library, true);
    assert.equal(merged.sitePublished, false);
    assert.equal(merged.heroPortal.enabled, true);
  });

  it("un guardado completo sigue pudiendo reemplazar el SEO", () => {
    const existing = sample();
    const merged = mergeSiteConfigPatch(existing, {
      seo: { title: "Desde Growth OS", description: "Nueva descripción" },
    });
    assert.equal(merged.seo.title, "Desde Growth OS");
    assert.equal(merged.seo.description, "Nueva descripción");
    assert.deepEqual(merged.seo.keywords, ["seminario"]);
    assert.equal(merged.seo.ogImage, "/og.jpg");
    assert.equal(merged.institution.name, "Seminario");
  });

  it("completa SEO vacío sin pisar uno ya escrito", () => {
    const empty = sample();
    empty.seo = { ...empty.seo, title: "", description: "", keywords: ["dato"] };
    const filled = fillBlankSeo(mergeSiteConfigPatch(empty, { contact: { phone: "+569" } }));
    assert.equal(filled.seo.title, "Seminario");
    assert.equal(filled.seo.description, "Formar");
    assert.deepEqual(filled.seo.keywords, ["dato"]);
    assert.equal(filled.contact.phone, "+569");

    const kept = fillBlankSeo(
      mergeSiteConfigPatch(sample(), {
        institution: { name: "Otro nombre" },
      })
    );
    assert.equal(kept.seo.title, "Título vigente");
    assert.equal(kept.institution.name, "Otro nombre");
  });

  it("la API no exige Growth OS y el cargador de NELZURI no dice portal", () => {
    const route = readFileSync(resolve(process.cwd(), "src/app/api/cms/config/route.ts"), "utf8");
    assert.match(route, /settings\.update/);
    assert.doesNotMatch(route, /growth-os|contractedApps/);

    const panel = readFileSync(
      resolve(process.cwd(), "src/components/config/BrandingPanel.tsx"),
      "utf8"
    );
    assert.match(panel, /Logo principal del portal/);
    assert.match(panel, /Logo principal de la organización/);
    assert.match(panel, /includePortalHero/);
  });
});
