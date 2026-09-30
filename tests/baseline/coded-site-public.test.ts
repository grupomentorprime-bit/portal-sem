import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { comingSoonModel, decidePublicSite } from "../../src/sites/public-decision";
import type { ContactInfo, SocialLinks } from "../../src/types/cms";

const emptyContact: ContactInfo = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  country: "",
  hours: "",
};

const emptySocial: SocialLinks = {
  facebook: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  tiktok: "",
  spotify: "",
};

describe("decidePublicSite", () => {
  it("sin espacio muestra la portada de la plataforma", () => {
    assert.deepEqual(
      decidePublicSite({
        hasTenant: false,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/contacto",
        registeredPaths: ["/"],
      }),
      { kind: "platform" }
    );
  });

  it("sin publicar muestra por comenzar en cualquier ruta", () => {
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: false,
        hasSiteModule: true,
        pathname: "/noticias",
        registeredPaths: ["/"],
      }).kind,
      "coming-soon"
    );
  });

  it("publicado sin carpeta sigue en por comenzar", () => {
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: false,
        pathname: "/",
        registeredPaths: [],
      }).kind,
      "coming-soon"
    );
  });

  it("publicado con carpeta abre la ruta registrada y 404 en el resto", () => {
    assert.deepEqual(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/",
        registeredPaths: ["/", "/contacto"],
      }),
      { kind: "page", path: "/" }
    );
    assert.deepEqual(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/contacto/",
        registeredPaths: ["/", "/contacto"],
      }),
      { kind: "page", path: "/contacto" }
    );
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/admision",
        registeredPaths: ["/", "/contacto"],
      }).kind,
      "not-found"
    );
  });
});

describe("comingSoonModel", () => {
  it("usa el texto exacto y omite campos vacíos", () => {
    const model = comingSoonModel({
      institutionName: "Seminario",
      contact: { ...emptyContact, email: "hola@sem.cl", phone: " " },
      social: { ...emptySocial, instagram: "https://instagram.com/sem" },
    });
    assert.equal(model.institutionName, "Seminario");
    assert.equal(model.message, "Este sitio está por comenzar");
    assert.deepEqual(
      model.lines.map((line) => line.label),
      ["Correo", "Instagram"]
    );
  });

  it("sin contacto deja solo el nombre y la frase", () => {
    const model = comingSoonModel({
      institutionName: "Seminario",
      contact: emptyContact,
      social: emptySocial,
    });
    assert.deepEqual(model.lines, []);
  });
});
