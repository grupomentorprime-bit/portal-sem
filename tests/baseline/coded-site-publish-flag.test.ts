import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultSiteConfig } from "../../src/lib/cms/defaults";
import { normalizeSiteConfig } from "../../src/lib/cms/normalize";
import { SITE_CONFIG_ID } from "../../src/types/cms";

describe("sitePublished", () => {
  it("default de un sitio nuevo es false", () => {
    assert.equal(createDefaultSiteConfig().sitePublished, false);
  });

  it("un documento sin el campo queda sin publicar", () => {
    const config = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "active" },
    });
    assert.ok(config);
    assert.equal(config.sitePublished, false);
  });

  it("solo true explícito publica", () => {
    const published = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      sitePublished: true,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "active" },
    });
    const inactive = normalizeSiteConfig({
      _id: SITE_CONFIG_ID,
      sitePublished: true,
      institution: { name: "SEM", shortName: "SEM", tenant: "sem", status: "inactive" },
    });
    assert.equal(published?.sitePublished, true);
    assert.equal(inactive?.sitePublished, true);
    assert.equal(inactive?.institution.status, "inactive");
  });
});
