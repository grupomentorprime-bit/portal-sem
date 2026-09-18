# OT-GROWTH-UX-FORMS-HUMAN-001 — Lenguaje humano en Formularios

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-FORMS-HUMAN-001 |
| Tipo | UX / copy visible |
| Fecha | 2026-09-18 |
| Estado | **APTO** |
| Alcance | Textos visibles del módulo Formularios (`/admin/portal/forms`) |
| Fuera de alcance | Contratos · API · persistencia · Captura→Persona→Oportunidad · automatizaciones · CMS FormFieldBuilder · otros módulos |

**Restricciones cumplidas:** sin segundo constructor; sin cambiar valores internos (`destination`, `type`, `name`, `options.value`); motor y modelos intactos.

---

## Gate final

# FORMULARIOS · LENGUAJE HUMANO · APTO

Un operador sin conocimiento técnico puede crear un formulario, agregar preguntas, elegir cómo responder, definir opciones y marcar obligatoriedad sin ver keys, sintaxis `Etiqueta|valor`, IDs de URL ni jerga de desarrollo.

---

## 1. Textos técnicos encontrados

| Superficie | Antes |
| --- | --- |
| Crear | Identificador (URL), Tipo / destino, labels de destination en jerga |
| Preguntas | Nombre interno (name), Etiqueta visible, Placeholder, Texto de ayuda, Tipo, Área de texto, Selección, Opciones (radio), Checkbox, Archivo, Oculto visible, Campo obligatorio, `Etiqueta\|valor` |
| Detalle | `Formulario · {id}`, Nombre interno, Campos, Acepta envíos, rutas `/formularios` en ayudas |
| Presentación | Hero, Eyebrow, breadcrumb, Overlay, CTA, Footer, Overline, Placeholder, Copyright, templates en crudo |
| SEO | Keywords, Imagen Open Graph |
| Apariencia | theme keys en inglés crudo (`attendance`, `hero`, Overlay) |
| Listado | Sincronizar, Editar experiencia/campos, copy de captación/landing |

## 2. Textos reemplazados (muestra)

| Antes | Después |
| --- | --- |
| Tipo / destino | ¿Para qué usarás este formulario? |
| Solicitud de información | Pedir información |
| Contacto | Recibir contactos |
| Inscripción a evento | Inscribir a un evento |
| Etiqueta visible | Pregunta |
| Placeholder | Ejemplo dentro del campo |
| Tipo | Tipo de respuesta |
| Área de texto | Respuesta larga |
| Selección | Lista de opciones |
| Opciones (radio) | Elegir una opción |
| Checkbox | Casilla |
| Archivo | Subir archivo |
| Campo obligatorio | Respuesta obligatoria |
| Campos (tab) | Preguntas |
| Nombre interno (configuración) | Nombre |
| Keywords / Open Graph | Palabras clave / Imagen al compartir |
| Hero / Eyebrow / CTA | Portada / Texto pequeño arriba / Texto del botón |

## 3. Ocultados o llevados a avanzado

- **Dirección del enlace (URL / slug)** → Opciones avanzadas en creación (auto desde el nombre).
- **Nombre interno del campo (`name`)** → Opciones avanzadas en preguntas.
- **Campo oculto (`hidden`)** → Opciones avanzadas (no en el selector normal).
- **Valor fijo de oculto** → Solo si está marcado como oculto.
- **ID del formulario en eyebrow** → Eliminado de la vista normal.
- **Valores/slugs de opciones** → Generados automáticamente; la UI solo edita la etiqueta visible.

## 4. Archivos modificados

- `src/components/admin/forms/CreateFormDialog.tsx`
- `src/components/admin/forms/ExperienceFormFieldsEditor.tsx`
- `src/components/admin/forms/FormDetailClient.tsx`
- `src/components/admin/forms/FormsCenterClient.tsx`
- `src/components/admin/forms/FormExperienceEditor.tsx`
- `src/components/admin/forms/FormExperienceSeoPanel.tsx`
- `src/components/admin/forms/FormExperienceAppearancePanel.tsx`
- `src/types/experience-form-experience.ts` (solo labels visibles de bloques)
- `tests/baseline/growth-ux-forms-human-001.test.ts` (nuevo)
- `docs/AI/auditorias/OT-GROWTH-UX-FORMS-HUMAN-001.md` (este)

## 5. Pruebas

- `tests/baseline/growth-ux-forms-human-001.test.ts` — copy humano + contrato interno intacto
- Regresión esperada: `growth-web-landing-001` (mantiene `Presentación` y `Sitio web → Páginas`)
- Manual: crear → agregar pregunta → lista de opciones → obligatoria → guardar/publicar

## 6. Resultado

**APTO**
