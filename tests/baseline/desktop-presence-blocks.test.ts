import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPRESA_BLOCKS,
  empresaBlockDirty,
  empresaBlockPatch,
  presenceBlocks,
} from "../../src/lib/desktop/presence-patch";
import type { SiteConfig } from "../../src/types/cms";

function baseConfig(): SiteConfig {
  return {
    _id: "site",
    schemaVersion: 2,
    institution: {
      name: "Seminario",
      shortName: "SEM",
      tenant: "sem",
      organization: "Red",
      website: "https://ejemplo.org",
      tagline: "Lema",
      status: "active",
    },
    branding: {
      logo: "",
      favicon: "",
      heroImage: "",
      homeHeroPhotos: [],
      primaryColor: "#000",
      secondaryColor: "#111",
      backgroundColor: "#fff",
      textColor: "#000",
    },
    seo: { title: "", description: "", keywords: [] },
    contact: {
      email: "a@ejemplo.org",
      phone: "+56 1",
      whatsapp: "+56 2",
      address: "Calle 1",
      city: "Chillán",
      country: "Chile",
      hours: "9-18",
    },
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
      linkedin: "",
      tiktok: "",
      spotify: "",
    },
    features: {
      blog: false,
      news: false,
      events: false,
      academicAgenda: false,
      institutionalNotices: false,
      store: false,
      library: false,
      forms: false,
      applications: false,
      onlinePayments: false,
    },
    sitePublished: false,
    portalCopy: {} as SiteConfig["portalCopy"],
    topBar: {} as SiteConfig["topBar"],
    portalExperience: {
      cursor: {} as SiteConfig["portalExperience"]["cursor"],
      footerPremium: {} as SiteConfig["portalExperience"]["footerPremium"],
    },
    modules: {
      heroPortal: {} as SiteConfig["modules"]["heroPortal"],
      branding: {} as SiteConfig["modules"]["branding"],
      menu: {} as SiteConfig["modules"]["menu"],
      footer: {} as SiteConfig["modules"]["footer"],
      content: {} as SiteConfig["modules"]["content"],
    },
    heroPortal: {} as SiteConfig["heroPortal"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("bloques de Mi empresa", () => {
  it("define los tres bloques de lectura/edición", () => {
    assert.deepEqual(
      EMPRESA_BLOCKS.map((block) => block.id),
      ["general", "contacto", "ubicacion"]
    );
  });

  it("deja el contacto público en Canales y fuera de Mi empresa", () => {
    assert.deepEqual(
      presenceBlocks("empresa").map((block) => block.id),
      ["general", "ubicacion"]
    );
    assert.deepEqual(
      presenceBlocks("canales").map((block) => block.id),
      ["contacto", "redes"]
    );
    assert.deepEqual(presenceBlocks("marca"), []);
    assert.deepEqual(presenceBlocks("sitio"), []);
  });

  it("guarda solo el bloque general sin tocar contacto", () => {
    const baseline = baseConfig();
    const current = structuredClone(baseline);
    current.institution.tagline = "Nuevo lema";
    current.contact.email = "no-debe-enviarse@ejemplo.org";

    const patch = empresaBlockPatch("general", baseline, current);
    assert.deepEqual(patch, { institution: { tagline: "Nuevo lema" } });
    assert.equal("contact" in patch, false);
    assert.equal(empresaBlockDirty("general", baseline, current), true);

    const onlyGeneral = structuredClone(baseline);
    onlyGeneral.institution.tagline = "Nuevo lema";
    assert.equal(empresaBlockDirty("contacto", baseline, onlyGeneral), false);
  });

  it("separa contacto y ubicación en patches distintos", () => {
    const baseline = baseConfig();
    const contactOnly = structuredClone(baseline);
    contactOnly.contact.phone = "+56 9";
    contactOnly.contact.city = "Santiago";

    assert.deepEqual(empresaBlockPatch("contacto", baseline, contactOnly), {
      contact: { phone: "+56 9" },
    });
    assert.deepEqual(empresaBlockPatch("ubicacion", baseline, contactOnly), {
      contact: { city: "Santiago" },
    });
  });

  it("las redes se guardan aparte del contacto", () => {
    const baseline = baseConfig();
    const current = structuredClone(baseline);
    current.social.instagram = "https://instagram.com/seminario";
    current.contact.email = "otro@ejemplo.org";

    assert.deepEqual(empresaBlockPatch("redes", baseline, current), {
      social: { instagram: "https://instagram.com/seminario" },
    });
    assert.equal(empresaBlockDirty("contacto", baseline, current), true);
    assert.equal(empresaBlockDirty("redes", baseline, structuredClone(baseline)), false);
  });

  it("la ubicación guarda la región junto con la ciudad", () => {
    const baseline = baseConfig();
    const current = structuredClone(baseline);
    current.contact.region = "Metropolitana";
    current.contact.city = "Santiago";

    assert.deepEqual(empresaBlockPatch("ubicacion", baseline, current), {
      contact: { region: "Metropolitana", city: "Santiago" },
    });
    assert.equal(empresaBlockDirty("contacto", baseline, current), false);
  });
});
