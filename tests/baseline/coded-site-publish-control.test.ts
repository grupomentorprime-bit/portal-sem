import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const hub = readFileSync("src/components/config/ConfigurationHub.tsx", "utf8");
const layout = readFileSync(
  "src/components/config/ConfigurationLayout.tsx",
  "utf8"
);

describe("Publicar sitio", () => {
  it("el guardado envía sitePublished y el control no toca institution.status", () => {
    assert.match(hub, /sitePublished: config\.sitePublished === true/);
    assert.match(hub, /onSitePublishedChange=\{\(sitePublished\) =>/);
    assert.match(layout, /Publicar sitio/);
    assert.match(layout, /Este sitio está por comenzar/);
    assert.match(layout, /onChange\(!published\)/);
    assert.doesNotMatch(hub, /sitePublished: status/);
    assert.doesNotMatch(layout, /sitePublished: status/);
  });
});
