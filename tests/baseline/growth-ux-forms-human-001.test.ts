/**
 * OT-GROWTH-UX-FORMS-HUMAN-001 — lenguaje humano en Formularios (solo UI).
 * No toca contratos, API ni motores.
 * Compatibilidad con OT-GROWTH-UX-FORMS-SIMPLE-001 (entrada y editor simplificados).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("OT-GROWTH-UX-FORMS-HUMAN-001 — lenguaje visible humano", () => {
  it("creación: URL técnica no se pide de entrada; plantillas humanas", () => {
    const src = readSrc("src/components/admin/forms/CreateFormDialog.tsx");
    const templates = readSrc("src/lib/admin/form-quick-templates.ts");
    assert.doesNotMatch(src, /Identificador \(URL\)/);
    assert.doesNotMatch(src, /Tipo \/ destino/);
    assert.match(src, /Crear con IA/);
    assert.match(src, /Usar una plantilla/);
    assert.match(src, /Crear desde cero/);
    assert.match(src, /Dirección del enlace/);
    assert.match(templates, /Pedir información/);
    assert.match(templates, /Recibir contactos/);
  });

  it("preguntas: sin sintaxis Etiqueta|valor ni name técnico a la vista", () => {
    const src = readSrc("src/components/admin/forms/ExperienceFormFieldsEditor.tsx");
    assert.doesNotMatch(src, /Nombre interno \(name\)/);
    assert.doesNotMatch(src, /Etiqueta visible/);
    assert.doesNotMatch(src, /Opciones \(una por línea/);
    assert.doesNotMatch(src, /Área de texto/);
    assert.doesNotMatch(src, /Opciones \(radio\)/);
    assert.match(src, /Tipo de respuesta/);
    assert.match(src, /Pregunta/);
    assert.match(src, /Ejemplo dentro del campo/);
    assert.match(src, /Respuesta obligatoria/);
    assert.match(src, /Respuesta larga/);
    assert.match(src, /Lista de opciones/);
    assert.match(src, /Elegir una opción/);
    assert.match(src, /Agregar opción/);
    assert.match(src, /Opciones avanzadas/);
    assert.match(src, /Campo oculto/);
  });

  it("detalle: no expone id interno en el eyebrow; pestañas simples", () => {
    const src = readSrc("src/components/admin/forms/FormDetailClient.tsx");
    assert.doesNotMatch(src, /Formulario · \{form\._id\}/);
    assert.doesNotMatch(src, /Nombre interno/);
    assert.match(src, /Formulario/);
    assert.match(src, /Más opciones/);
    assert.match(src, /Publicar/);
  });

  it("valores internos de destination y field types siguen en el contrato", () => {
    const types = readSrc("src/types/experience-forms.ts");
    assert.match(types, /information_request/);
    assert.match(types, /event_registration/);
    assert.match(types, /"textarea"/);
    assert.match(types, /"hidden"/);
    assert.match(types, /"radio"/);
  });
});
