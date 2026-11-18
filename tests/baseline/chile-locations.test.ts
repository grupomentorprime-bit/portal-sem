import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactForm } from "../../src/components/config/ContactForm";
import {
  CHILE_REGIONS,
  canonicalChileRegion,
  chileRegionForCity,
  citiesInChileRegion,
} from "../../src/lib/geo/chile-locations";
import type { ContactInfo } from "../../src/types/cms";

describe("regiones y ciudades de Chile", () => {
  it("tiene las 16 regiones y cada una tiene ciudades", () => {
    assert.equal(CHILE_REGIONS.length, 16);
    for (const region of CHILE_REGIONS) {
      assert.ok(region.cities.length > 0, region.name);
    }
  });

  it("no repite una ciudad en dos regiones", () => {
    const seen = new Map<string, string>();
    for (const region of CHILE_REGIONS) {
      for (const city of region.cities) {
        const key = city
          .trim()
          .toLocaleLowerCase("es")
          .normalize("NFD")
          .replace(/\p{M}/gu, "");
        const previous = seen.get(key);
        assert.equal(previous, undefined, `${city} está en ${previous} y en ${region.name}`);
        seen.set(key, region.name);
      }
    }
  });

  it("reconoce Chillán en Ñuble y Talca en el Maule", () => {
    assert.equal(chileRegionForCity("Chillán"), "Ñuble");
    assert.equal(chileRegionForCity("Talca"), "Maule");
    assert.equal(chileRegionForCity("Santiago"), "Metropolitana");
    assert.equal(canonicalChileRegion("Región del Maule"), "Maule");
    assert.equal(canonicalChileRegion("Región Metropolitana"), "Metropolitana");
    assert.ok(citiesInChileRegion("Ñuble").includes("Chillán"));
    assert.ok(citiesInChileRegion("Maule", "Talca").includes("Talca"));
  });

  it("conserva una ciudad que todavía no está en la lista de la región", () => {
    assert.deepEqual(citiesInChileRegion("Ñuble", "Pueblo nuevo"), ["Pueblo nuevo", ...citiesInChileRegion("Ñuble")]);
  });

  it("en Ubicación ofrece la región de la ciudad y las ciudades de esa región", () => {
    const contact: ContactInfo = {
      email: "",
      phone: "",
      whatsapp: "",
      address: "Aurora, Talca",
      city: "Chillán",
      country: "Chile",
      hours: "",
    };
    const html = renderToStaticMarkup(
      createElement(ContactForm, {
        value: contact,
        onChange: () => {},
        scope: "location",
        framed: false,
      })
    );
    assert.match(html, /<option value="Ñuble" selected="">Ñuble<\/option>/);
    assert.match(html, /<option value="Maule">Maule<\/option>/);
    assert.match(html, /<option value="Chillán" selected="">Chillán<\/option>/);
    assert.doesNotMatch(html, /<option value="Talca">/);
    assert.doesNotMatch(html, /placeholder="Chillán"/);
  });
});
