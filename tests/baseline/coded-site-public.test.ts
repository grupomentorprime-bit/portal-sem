import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  comingSoonModel,
  decidePublicSite,
  isContractedSiteModule,
} from "../../src/sites/public-decision";
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

  it("el formulario se abre aunque el sitio siga por comenzar", () => {
    assert.deepEqual(
      decidePublicSite({
        hasTenant: true,
        sitePublished: false,
        hasSiteModule: false,
        pathname: "/formularios/convocatoria-talca-aurora-nov-2026",
        registeredPaths: [],
      }),
      { kind: "passthrough" }
    );
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        pathname: "/ayuda",
        registeredPaths: ["/"],
      }).kind,
      "passthrough"
    );
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: false,
        hasSiteModule: false,
        pathname: "/",
        registeredPaths: [],
      }).kind,
      "coming-soon"
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

  it("publicado y habilitado sin carpeta abre el portal", () => {
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        hasCodedSite: false,
        pathname: "/",
        registeredPaths: [],
      }).kind,
      "portal"
    );
    assert.equal(
      decidePublicSite({
        hasTenant: true,
        sitePublished: true,
        hasSiteModule: true,
        hasCodedSite: false,
        pathname: "/programas",
        registeredPaths: [],
      }).kind,
      "portal"
    );
  });

  it("publicado sin módulo sigue en por comenzar", () => {
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

describe("isContractedSiteModule", () => {
  it("un cliente nuevo con el módulo apagado no recibe sitio aunque publique", () => {
    assert.equal(
      isContractedSiteModule({
        hasCodedSite: false,
        siteEnabled: false,
        sitePublished: true,
      }),
      false
    );
  });

  it("un sitio ya publicado sin el campo conserva el portal", () => {
    assert.equal(
      isContractedSiteModule({
        hasCodedSite: false,
        siteEnabled: undefined,
        sitePublished: true,
      }),
      true
    );
    assert.equal(
      isContractedSiteModule({
        hasCodedSite: false,
        siteEnabled: undefined,
        sitePublished: false,
      }),
      false
    );
  });

  it("la carpeta de código no habilita a otro cliente", () => {
    assert.equal(
      isContractedSiteModule({
        hasCodedSite: true,
        siteEnabled: false,
        sitePublished: false,
      }),
      true
    );
    assert.equal(
      isContractedSiteModule({
        hasCodedSite: false,
        siteEnabled: true,
        sitePublished: false,
      }),
      true
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
