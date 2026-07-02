# OT-CMSV2-DESIGN-001 — Diseño UX del Constructor Visual del Portal

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-DESIGN-001 |
| Épica | EP-001 — Portal Institucional Premium (CMS / EP-001A propuesto) |
| Prioridad | Muy alta |
| Estado | Diseño (Fase 1) |
| Dependencia | [OT-CMSV2-001A](./OT-CMSV2-001A.md) ✅ |
| Entregable diseño | [VISUAL-EXPERIENCE-BUILDER.md](../design/VISUAL-EXPERIENCE-BUILDER.md) |

## Objetivo

Definir la experiencia del **Visual Experience Builder** — el Centro Editorial Inteligente del Portal Institucional — donde cualquier editor administre el sitio **sin conocimientos técnicos**, sin código, sin JSON y sin imaginar el resultado: siempre con vista previa real.

No es otro Page Builder al estilo WordPress. Es la capa editorial premium del ecosistema AprendeHoy, reutilizable multi-institución.

## Alcance

### Fase 1 — Diseño UX (esta OT)

| Entregable | Estado |
| --- | --- |
| Wireframes de pantalla completa | ✅ en VISUAL-EXPERIENCE-BUILDER |
| Flujos de usuario (editar, publicar, historial) | ✅ |
| Mapa de componentes (`VisualBuilder` → implementación) | ✅ |
| Especificación del Inspector por bloque (Hero, Programas, …) | ✅ |
| Gap analysis vs `PageBuilder` actual | ✅ |
| Atajos, estados editoriales, criterios de aceptación | ✅ |

### Fases de implementación (OTs futuras)

| Fase | OT propuesta | Contenido |
| --- | --- | --- |
| 2 | OT-CMSV2-BUILD-001 | Infraestructura: `VisualBuilder`, Canvas, Inspector, Toolbar |
| 3 | OT-CMSV2-BUILD-002 | Primer bloque: Hero |
| 4 | OT-CMSV2-BUILD-003 | Programas |
| 5 | OT-CMSV2-BUILD-004 | Noticias |
| 6 | OT-CMSV2-BUILD-005 | Home completa (migración portal-001) |

## Arquitectura

### Jerarquía de navegación

```
Centro de Administración (/admin)
└── Portal (/admin/pages)
    └── Páginas del sitio
        └── Editar página (/admin/pages/[id])
            └── Visual Experience Builder (pantalla completa)
```

### Layout de tres columnas

```
┌────────────────────────────────────────────────────────────────┐
│ BuilderToolbar — breadcrumb, estado, guardar, publicar, historial │
├──────────────┬─────────────────────────────┬───────────────────┤
│ BuilderSidebar│ BuilderCanvas              │ BuilderInspector  │
│ Estructura   │ Vista previa real (portal) │ Propiedades       │
│ DnD bloques  │ + PreviewSwitcher          │ del bloque activo │
└──────────────┴─────────────────────────────┴───────────────────┘
```

### Componentes a diseñar / implementar

| Componente | Responsabilidad |
| --- | --- |
| `VisualBuilder` | Orquestador; estado de página, bloque seleccionado, dispositivo |
| `BuilderToolbar` | Acciones globales siempre visibles |
| `BuilderBreadcrumb` | `Portal > Inicio` + badge de estado |
| `BuilderSidebar` | Lista de bloques, DnD, acciones por bloque |
| `BuilderCanvas` | Render del portal real (`BlockPreview` / `PortalBlockSection`) |
| `BuilderInspector` | Campos contextuales; sin JSON/HTML |
| `BuilderBlock` | Ítem de sidebar con grip, menú de acciones |
| `PreviewSwitcher` | Escritorio / Tablet / Móvil |
| `HistoryPanel` | Timeline de versiones + restaurar |
| `PublishPanel` | Flujo publicar / programar / solicitar revisión |

### Relación con código existente

| Actual (`page-builder/`) | Evolución |
| --- | --- |
| `PageBuilder.tsx` | Reemplazado por `VisualBuilder` |
| `SortableBlocks` | → `BuilderSidebar` + DnD mejorado |
| `BlockEditor` | → `BuilderInspector` (campos visuales por bloque) |
| `BlockPreview` + `PreviewDevice` | → `BuilderCanvas` + `PreviewSwitcher` |
| `PageEditorClient` | Shell con `AdminModuleLayout` mínimo + builder fullscreen |

Persistencia sin cambios de contrato: `cms_pages`, `versions[]`, API `PUT /api/cms/pages/[id]`.

## UX

### Principios (innegociables)

1. El editor **nunca** trabaja con código.
2. **Siempre** existe vista previa — el portal real, no wireframe.
3. **Todo** se puede mover (drag & drop).
4. **Todo** tiene historial.
5. **Publicar** debe ser extremadamente simple.

### Inspiración de producto

Notion (simplicidad) · Webflow (edición visual) · Shopify (gestión) · Framer (fluidez) · Apple (claridad).

### Referencias internas

- [CMS-UX-GUIDELINES.md](../design/CMS-UX-GUIDELINES.md)
- [VISUAL-EXPERIENCE-BUILDER.md](../design/VISUAL-EXPERIENCE-BUILDER.md)
- [EDITORIAL-ART-DIRECTION.md](../design/EDITORIAL-ART-DIRECTION.md)
- [PAGE-BUILDER.md](../cms/PAGE-BUILDER.md) — modelo de datos vigente

## Diseño

- Experience Kit (`src/components/ui`, `src/components/portal`)
- Tokens SEM en `globals.css` / `brand.css`
- Biblioteca Institucional (`MediaPicker` → modal fullscreen, no `<input type="file">` suelto en inspector)

## APIs

Sin cambios de contrato en Fase 1. Fase 2+ puede añadir:

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/cms/pages/[id]/versions` | Historial (si se expone dedicado) |
| POST | `/api/cms/pages/[id]/restore` | Restaurar versión |

Hoy: versiones en documento `cms_pages.versions[]` vía `PUT` existente.

## Base de datos

- `cms_pages` — bloques, `status`, `versions[]`
- Estados página: `draft`, `published`, `scheduled`, `archived`
- Estados UX futuros: **En revisión** (mapeo a `draft` + workflow OT futura)

## Seguridad

- Permisos: `cms.pages.update`, `cms.pages.publish`
- HTML/Markdown blocks: **ocultos** del editor estándar (`adminOnly` en biblioteca)
- Auditoría: integrar con timeline institucional (`identity_audit`)

## Validaciones

- Inspector: solo campos definidos en schema por bloque
- Publicar: validación `page-validation.ts` antes de cambiar status
- Imágenes: solo desde Biblioteca Institucional (`MediaPicker`)

## Documentación

| Documento | Acción |
| --- | --- |
| VISUAL-EXPERIENCE-BUILDER.md | **Creado** — especificación UX completa |
| CMS-UX-GUIDELINES.md | Actualizado — sección Visual Builder |
| OT-CMSV2-DESIGN-001.md | Creado — este registro |
| PAGE-BUILDER.md | Actualizar en Fase 2 con referencia al Visual Builder |

## Criterios de aceptación (diseño — Fase 1)

| Criterio | Estado |
| --- | --- |
| Wireframe pantalla completa aprobado | ✅ documentado |
| Flujos editar / guardar / publicar / historial | ✅ documentado |
| Mapa de componentes con nombres canónicos | ✅ documentado |
| Inspector Hero sin campos técnicos | ✅ especificado |
| Gap analysis vs implementación actual | ✅ documentado |
| Atajos de teclado definidos | ✅ documentado |
| Estados editoriales con etiquetas institucionales | ✅ documentado |
| Integración Biblioteca Institucional especificada | ✅ documentado |

## Criterios de aceptación (implementación — Fases 2–6)

| Criterio | Fase |
| --- | --- |
| Reorganizar bloques con drag & drop | 2 |
| Vista previa tiempo real desktop / tablet / móvil | 2 |
| Panel contextual por bloque | 2–5 |
| Borrador, publicar, restaurar versiones | 2 |
| Biblioteca Institucional como selector de medios | 2 |
| Sin HTML, JSON ni IDs visibles al editor | 2–6 |
| Consistente con Centro de Administración | 2 |
| Home portal-001 editable visualmente | 6 |

## Restricciones

- No romper render público (`PortalBlockSection`, bloques existentes)
- No exponer `tenant`, `block.type` raw, ni `settings` JSON al usuario
- Reutilizar `BlockPreview` / adapters existentes en canvas
- El builder debe funcionar en viewport ≥ 1024px; en móvil: mensaje “Usa escritorio para editar”

## Visión a largo plazo

El Visual Experience Builder es el **producto diferenciador** de AprendeHoy frente a LMS/CMS tradicionales: misma experiencia para SEM, universidades, institutos y centros de capacitación — solo cambian componentes, identidad y contenido.

## Restricciones de esta OT

**Solo diseño.** No se implementa código en OT-CMSV2-DESIGN-001. La implementación inicia en OT-CMSV2-BUILD-001 (Fase 2).
