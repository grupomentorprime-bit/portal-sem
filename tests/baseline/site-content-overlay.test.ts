import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  editorFields,
  listEditablePages,
  mergeSiteContent,
  parseStoredValue,
  resolvePageContent,
  sanitizeStoredContent,
  slotAnimationEnabled,
  slotImage,
  slotText,
} from "../../src/sites/content/overlay";
import type { CodedSitePage } from "../../src/sites/types";

const home: CodedSitePage = {
  path: "/",
  title: "Inicio",
  navLabel: "Inicio",
  slots: [
    {
      id: "hero.kicker",
      label: "Antetítulo",
      type: "text",
      default: "Formación",
    },
    {
      id: "hero.lead",
      label: "Bajada",
      type: "text",
      multiline: true,
      default: "Capacitación para empresas.",
    },
    {
      id: "hero.image",
      label: "Imagen principal",
      type: "image",
      default: { src: "/fotos/formacion.jpg", alt: "Taller de formación" },
    },
    {
      id: "hero.animation",
      label: "Animaciones",
      type: "animation",
      default: true,
    },
  ],
};

describe("overlay de contenido del sitio", () => {
  it("sin overlay usa los defaults del código", () => {
    const resolved = resolvePageContent(home, undefined);
    assert.equal(slotText(resolved, "hero.kicker", ""), "Formación");
    assert.equal(slotImage(resolved, "hero.image", { src: "", alt: "" }).src, "/fotos/formacion.jpg");
    assert.equal(slotAnimationEnabled(resolved, "hero.animation", false), true);
  });

  it("el overlay gana solo en slots declarados y del mismo tipo", () => {
    const resolved = resolvePageContent(home, {
      "hero.kicker": { type: "text", value: "Capacitación" },
      "hero.animation": { type: "animation", enabled: false },
      "hero.image": { type: "text", value: "no-es-imagen" },
      "otro.campo": { type: "text", value: "ignorado" },
    });
    assert.equal(slotText(resolved, "hero.kicker", ""), "Capacitación");
    assert.equal(slotAnimationEnabled(resolved, "hero.animation", true), false);
    assert.equal(slotImage(resolved, "hero.image", { src: "x", alt: "" }).src, "/fotos/formacion.jpg");
    assert.equal(resolved["otro.campo"], undefined);
  });

  it("rechaza claves o tipos que el código no declara", () => {
    const result = sanitizeStoredContent(home.slots ?? [], {
      "hero.kicker": { type: "text", value: "Ok" },
      "hero.image": { type: "text", value: "mal" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /imagen|tipo|slot/i);
  });

  it("acepta solo el overlay válido y arma los campos del editor", () => {
    const saved = sanitizeStoredContent(home.slots ?? [], {
      "hero.kicker": { type: "text", value: "Capacitación" },
      "hero.animation": { type: "animation", enabled: false },
    });
    assert.equal(saved.ok, true);
    if (!saved.ok) return;
    const fields = editorFields(home, saved.values);
    assert.equal(fields.length, 4);
    assert.equal(fields[0]?.value.type, "text");
    if (fields[0]?.value.type === "text") assert.equal(fields[0].value.value, "Capacitación");
    assert.equal(fields[3]?.value.type, "animation");
    if (fields[3]?.value.type === "animation") assert.equal(fields[3].value.enabled, false);
  });

  it("lista las páginas del sitio aunque no tengan slots", () => {
    const pages = listEditablePages({
      tenantId: "fixture",
      pages: [home, { path: "/contacto", title: "Contacto", navLabel: "Contacto" }],
      forms: [],
    });
    assert.equal(pages[0]?.slotCount, 4);
    assert.equal(pages[1]?.slotCount, 0);
    assert.deepEqual(listEditablePages(undefined), []);
  });

  it("parseStoredValue ignora basura", () => {
    assert.equal(parseStoredValue({ type: "text", value: "hola" })?.type, "text");
    assert.equal(parseStoredValue({ type: "image", src: "/a.jpg" })?.type, "image");
    assert.equal(parseStoredValue({ type: "animation", enabled: false })?.type, "animation");
    assert.equal(parseStoredValue({ type: "text" }), undefined);
    assert.equal(parseStoredValue("hola"), undefined);
  });

  it("mergeSiteContent rellena slots faltantes con default", () => {
    const merged = mergeSiteContent(home.slots ?? [], {
      "hero.lead": { type: "text", value: "Nueva bajada" },
    });
    assert.equal(slotText(merged, "hero.lead", ""), "Nueva bajada");
    assert.equal(slotText(merged, "hero.kicker", ""), "Formación");
  });
});
