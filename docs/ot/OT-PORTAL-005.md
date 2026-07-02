# OT-PORTAL-005 — Cierre Editorial de la Experiencia de Admisión (CMS First)

| Atributo | Valor |
| --- | --- |
| OT | OT-PORTAL-005 |
| Épica | EP-001 — Portal Institucional |
| Dependencia | OT-PORTAL-004 (Centro de Admisión), OT-CMSV2-COMPONENTS-001 |
| Estado | Completada |
| Ruta pública | `/admision#cierre-institucional` |
| Panel CMS | `/admin/portal/admission` |

## Objetivo

Rediseñar el tramo final del Portal de Admisión como cierre editorial e institucional, completamente administrable desde el CMS, sin textos, imágenes, botones, enlaces ni estadísticas codificados en React.

## Entregables

| Entregable | Ubicación |
| --- | --- |
| Tipos del Cierre Institucional | `src/types/admission-closing.ts` |
| Extensión `AdmissionConfig` | `sections[]`, `closing` |
| Defaults CMS (no en componentes) | `src/lib/portal/admission-closing-defaults.ts` |
| Render público | `src/components/portal/admission/AdmissionClosing.tsx` |
| Bloques de cierre (9) | `src/components/portal/admission/closing/` |
| Estilos editoriales | `src/styles/admission-closing.css` |
| Página dinámica | `src/app/(site)/admision/page.tsx` |
| Panel CMS | `src/app/admin/portal/admission/page.tsx` |
| Editor con DnD | `src/components/admin/admission/` |

## Bloques del Cierre Institucional

| # | Bloque | Tipo CMS | Campos clave |
| --- | --- | --- | --- |
| 1 | Mensaje institucional | `message` | eyebrow, título, subtítulo, descripción, imagen, overlay, alineación |
| 2 | Acciones principales | `actions` | botones ilimitados: texto, icono, URL, nueva pestaña, color, orden, visible |
| 3 | Indicadores | `indicators` | tarjetas: icono, título, valor, descripción, visible, orden |
| 4 | Frase institucional | `quote` | texto, autor, referencia, comillas, firma, visible |
| 5 | Contacto | `contact` | título, descripción, correo, teléfono, WhatsApp, horario, dirección, mapa, redes |
| 6 | Footer institucional | `footer` | columnas dinámicas con enlaces tipados |
| 7 | Fondo editorial | `background` | imagen/video/patrón/textura/gradiente, overlay, parallax, blur |
| 8 | Sello institucional | `seal` | líneas, tipo, color, posición, opacidad, tamaño |
| 9 | Copyright | `copyright` | textos principal/secundario, línea desarrollador |

**Bloque 10 (Biblioteca multimedia):** política transversal — todos los selectores usan `MediaField` → Biblioteca de Medios institucional.

## Secciones de Admisión

Orden y visibilidad configurables vía `sections[]`:

Hero → Requisitos → Calendario → Costos → Becas → Formulario → FAQ → **Cierre Institucional**

## Criterios de aceptación

- [x] Ningún texto fijo en componentes del cierre (defaults solo en `admission-closing-defaults.ts`)
- [x] Imágenes vía Biblioteca de Medios (`mediaId` / `imageMediaId`)
- [x] Enlaces y botones desde CMS
- [x] Bloques activables/desactivables
- [x] Orden por drag & drop (secciones y bloques de cierre)
- [x] Compatible con arquitectura VEB (tipos listos para Inspector)
- [x] Multi-tenant (`portal_admission_config` por tenant)
- [x] Dirección de Arte Editorial (`admission-closing.css`)
- [x] `npm run build` ✅

## Siguiente paso

- Editores visuales para Hero, Requisitos, etc. vía OT-CMSV2-BUILD-001A
- Migrar selectores del admin al Inspector Library (`InspectorImagePicker`, etc.)
