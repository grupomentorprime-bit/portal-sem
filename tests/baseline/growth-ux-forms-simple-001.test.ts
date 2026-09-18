/**
 * OT-GROWTH-UX-FORMS-SIMPLE-001 — creación/edición simple de formularios (solo UX).
 * Reutiliza el motor Experience Form; no crea segundo constructor ni cambia contratos.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FORM_QUICK_TEMPLATES,
  getFormQuickTemplate,
} from "@/lib/admin/form-quick-templates";

function readSrc(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("OT-GROWTH-UX-FORMS-SIMPLE-001 — entrada y plantillas", () => {
  it("entrada ofrece IA, plantilla y desde cero", () => {
    const src = readSrc("src/components/admin/forms/CreateFormDialog.tsx");
    assert.match(src, /¿Qué quieres crear\?/);
    assert.match(src, /Crear con IA/);
    assert.match(src, /Usar una plantilla/);
    assert.match(src, /Crear desde cero/);
    assert.match(src, /tab=formulario/);
  });

  it("plantillas rápidas humanas con campos del modelo actual", () => {
    const labels = FORM_QUICK_TEMPLATES.map((t) => t.label);
    assert.deepEqual(labels, [
      "Pedir información",
      "Recibir contactos",
      "Inscripción",
      "Postulación",
      "Encuesta",
      "Reserva",
    ]);

    const info = getFormQuickTemplate("information");
    assert.equal(info.destination, "information_request");
    const infoLabels = info.fields.map((f) => f.label);
    assert.ok(infoLabels.includes("Nombre completo"));
    assert.ok(infoLabels.includes("Correo"));
    assert.ok(infoLabels.includes("Teléfono"));
    assert.ok(infoLabels.includes("¿Qué te interesa?"));
    assert.ok(infoLabels.includes("Mensaje"));

    for (const template of FORM_QUICK_TEMPLATES) {
      assert.ok(template.fields.length >= 2);
      for (const field of template.fields) {
        assert.ok(field.id);
        assert.ok(field.name);
        assert.ok(field.type);
        assert.ok(field.label);
      }
    }
  });

  it("IA prepara UX pero reutiliza plantilla del motor (sin segundo formato)", () => {
    const src = readSrc("src/components/admin/forms/CreateFormDialog.tsx");
    assert.match(src, /handleCreateFromAi/);
    assert.match(src, /getFormQuickTemplate\("information"\)/);
    assert.match(src, /Necesito un formulario para personas interesadas/);
    assert.doesNotMatch(src, /openai|anthropic|llm/i);
  });
});

describe("OT-GROWTH-UX-FORMS-SIMPLE-001 — editor y publicación", () => {
  it("detalle concentra Formulario + Respuestas + Más opciones", () => {
    const src = readSrc("src/components/admin/forms/FormDetailClient.tsx");
    assert.match(src, /FormSimpleVisualEditor/);
    assert.match(src, />Formulario</);
    assert.match(src, /Más opciones/);
    assert.match(src, /Vista previa/);
    assert.match(src, /Guardar/);
    assert.match(src, /Publicar/);
    // Ya no se obliga a navegar pestañas técnicas en la barra principal
    assert.doesNotMatch(src, />Preguntas</);
    assert.doesNotMatch(src, />SEO</);
    assert.doesNotMatch(src, />Apariencia</);
    assert.doesNotMatch(src, />Configuración</);
    // Presentación sigue disponible dentro de Más opciones
    assert.match(src, /label: "Presentación"/);
  });

  it("Más opciones agrupa presentación, SEO, apariencia y configuración", () => {
    const src = readSrc("src/components/admin/forms/FormDetailClient.tsx");
    assert.match(src, /presentacion/);
    assert.match(src, /Cómo se comparte/);
    assert.match(src, /apariencia/);
    assert.match(src, /configuracion/);
    assert.match(src, /Lista de preguntas/);
    assert.match(src, /Acepta respuestas/);
  });

  it("Publicar activa respuestas y visibilidad en una sola intención", () => {
    const src = readSrc("src/components/admin/forms/FormDetailClient.tsx");
    assert.match(src, /handlePublish/);
    assert.match(src, /active: true/);
    assert.match(src, /visible: isPrivate \? form\.visible : true/);
  });

  it("editor visual parece el formulario público", () => {
    const src = readSrc("src/components/admin/forms/FormSimpleVisualEditor.tsx");
    assert.match(src, /Agregar pregunta/);
    assert.match(src, /Enviar/);
    assert.match(src, /form-simple-editor__canvas/);
    assert.match(src, /Tipo de respuesta/);
    assert.match(src, /Respuesta obligatoria/);
  });
});
