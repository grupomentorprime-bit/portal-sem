# OT-GROWTH-UX-FORMS-SIMPLE-001 — Formularios simples (creación y edición)

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-FORMS-SIMPLE-001 |
| Tipo | UX |
| Fecha | 2026-09-18 |
| Estado | **APTO** |
| Alcance | Entrada de creación, plantillas rápidas, editor visual, publicación unificada, “Más opciones” |
| Fuera de alcance | Motor nuevo · contratos · respuestas · Growth Core · Persona · Oportunidad · automatizaciones · multi-tenant · IA real |

**Restricciones cumplidas:** sin segundo constructor; mismos `fields` / `destination` / APIs; formularios existentes intactos; slug, nombres internos y SEO siguen en el motor, ocultos al usuario normal.

---

## Gate final

# FORMULARIOS · UX SIMPLE · APTO

Una persona sin conocimientos técnicos puede: Nuevo formulario → elegir qué necesita → ajustar preguntas → Vista previa → Publicar, sin entrar a configuraciones técnicas.

---

## 1. Componentes reutilizados

| Componente / pieza | Uso |
| --- | --- |
| `CreateFormDialog` | Evolucionado: entrada IA / plantilla / desde cero |
| `POST /api/experience/forms` | Misma API de creación |
| `ExperienceFormDefinition` + field types | Sin cambios de contrato |
| `ExperienceFormFieldsEditor` | Conservado en Más opciones → Lista de preguntas |
| `FormExperienceEditor` (+ SEO / Apariencia) | Conservado en Más opciones |
| `FormSubmissionsPanel` / roster | Intactos (Respuestas / Participantes) |
| `FormsCenterClient` | Enlaces al tab `formulario` |
| `form-quick-templates.ts` (**nuevo**) | Solo datos iniciales del modelo actual |

**Nuevo UI:** `FormSimpleVisualEditor` — canvas que parece el formulario público + panel simple de edición (misma estructura de campos).

---

## 2. Pantallas simplificadas

| Antes | Ahora |
| --- | --- |
| Crear: nombre + destino + opciones avanzadas | ¿Qué quieres crear? → IA / plantilla / desde cero |
| Pestañas: Respuestas · Preguntas · Presentación · SEO · Apariencia · Configuración | **Formulario** · Respuestas (o Participantes) · **Más opciones** |
| Editor de preguntas tipo builder técnico | Canvas visual (título, texto, preguntas, Enviar) |
| Publicar = Acepta respuestas + Mostrar en portal + Guardar (manual) | Un botón **Publicar** |

---

## 3. Flujo final de creación

1. **Nuevo formulario**
2. Elegir:
   - **Crear con IA** — prompt visual; por ahora abre editor con plantilla “Pedir información” (sin motor IA nuevo).
   - **Usar una plantilla** — Pedir información · Recibir contactos · Inscripción · Postulación · Encuesta · Reserva.
   - **Crear desde cero** — nombre + descripción; slug en Más opciones.
3. Se crea borrador (`active: false`, `visible: false`) con campos del modelo actual.
4. Redirección a `/admin/portal/forms/{id}?tab=formulario`.

---

## 4. Flujo final de edición

1. Abrir formulario → tab **Formulario** (por defecto).
2. Editar título, descripción y preguntas en el canvas.
3. **Vista previa** (abre la URL pública).
4. **Guardar** (borrador / cambios).
5. **Publicar** (una intención).

---

## 5. Qué quedó en “Más opciones”

- Presentación (experiencia / landing del formulario)
- Cómo se comparte (SEO)
- Apariencia
- Configuración (interruptores finos `active` / `visible`, mensajes al enviar)
- Lista de preguntas (builder avanzado previo)

---

## 6. Publicación — decisión funcional

| Estado | Significado | ¿Separados? |
| --- | --- | --- |
| `active` | Acepta envíos | Sí (casos: cerrar sin ocultar) |
| `visible` | Listado en portal | Sí (casos: enlace privado / ocultar sin cerrar) |

**Publicar** en la barra principal: `active: true` + `visible: true` (si no es privado). Los interruptores finos permanecen en Configuración para excepciones. No hay bloqueo funcional que obligue al usuario normal a activarlos por separado.

---

## 7. Descripción visual del resultado

**Entrada:** tres tarjetas (IA · plantilla · desde cero); plantillas en grilla de 6 opciones humanas.

**Editor:** tarjeta centrada con título editable, subtítulo, campos con aspecto de inputs/selects, “+ Agregar pregunta”, botón Enviar decorativo; panel lateral para editar la pregunta seleccionada.

**Acciones:** Vista previa · Guardar · Publicar.

---

## 8. Archivos

- `src/lib/admin/form-quick-templates.ts`
- `src/components/admin/forms/CreateFormDialog.tsx`
- `src/components/admin/forms/FormSimpleVisualEditor.tsx`
- `src/components/admin/forms/FormDetailClient.tsx`
- `src/components/admin/forms/FormsCenterClient.tsx`
- `src/styles/admin-forms-center.css`
- `tests/baseline/growth-ux-forms-simple-001.test.ts`
- `tests/baseline/growth-ux-forms-human-001.test.ts` (alineado)
- `docs/AI/auditorias/OT-GROWTH-UX-FORMS-SIMPLE-001.md` (este)

---

## 9. Pruebas

- `tests/baseline/growth-ux-forms-simple-001.test.ts`
- `tests/baseline/growth-ux-forms-human-001.test.ts`
- Regresión: `growth-web-landing-001` (Presentación + Sitio web → Páginas)
- Manual: Nuevo → plantilla Pedir información → ajustar pregunta → Guardar → Publicar

## 10. Resultado

**APTO**
