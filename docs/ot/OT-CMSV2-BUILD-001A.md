# OT-CMSV2-BUILD-001A — Experience Studio Core

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-BUILD-001A |
| Épica | EP-002 — Experience Studio |
| Dependencia | OT-CMSV2-COMPONENTS-001 ✅ |
| Estado | Completada |
| Ruta | `/admin/pages/[id]` (Experience Studio) |

## Objetivo

Construir el núcleo del **Experience Studio** — constructor visual institucional para crear, editar y publicar páginas del portal sin escribir código.

Solo infraestructura reutilizable; no nuevas páginas ni bloques específicos.

## Arquitectura entregada

```
Experience Studio
├── ExperienceStudio.tsx      # Orquestador
├── StudioToolbar.tsx         # Guardar, publicar, undo/redo, dispositivos, export/import
├── StudioComponentLibrary.tsx # Panel izquierdo: estructura + biblioteca
├── StudioCanvas.tsx          # Canvas central con componentes reales
├── StudioInspector.tsx       # Inspector universal (Schema + bridge legacy)
├── StudioHistoryPanel.tsx    # Versiones guardadas
├── SchemaInspector.tsx       # Inspector auto-generado desde schema
└── inspector/                # Biblioteca OT-CMSV2-COMPONENTS-001

src/lib/experience-studio/
├── registry.ts               # Component Registry
├── schema/definitions.ts     # Schema Engine (bloques iniciales)
├── page-engine.ts            # Export / import JSON
└── undo-redo.ts              # Deshacer / rehacer en sesión
```

## Layout

Tres columnas fijas (≥1280px):

| Izquierda | Centro | Derecha |
| --- | --- | --- |
| Estructura + Biblioteca de componentes | Canvas (preview real) | Inspector universal |

Sin modales para editar bloques. Click directo en el canvas selecciona el bloque y actualiza el Inspector.

## Schema Engine

Bloques con schema explícito (Inspector auto-generado, sin formularios manuales):

- `hero`, `text`, `faq`, `cta_premium`, `stats`, `timeline`, `gallery`, `video`, `divider`

Bloques con `useLegacyEditor: true` usan `BlockEditor` como puente hasta migración en OTs BUILD-002+.

## Component Registry

`buildComponentRegistry()` une `BlockDefinition` + schema + categorías institucionales (Hero, Contenido, Programas, CTA, FAQ, etc.).

## Funcionalidades

| Función | Implementación |
| --- | --- |
| Drag & Drop | `SortableBlocks` en panel Estructura |
| Click-to-select | `BlockRenderer` + overlays en canvas |
| Responsive | Toolbar: Escritorio / Tablet / Móvil |
| Undo / Redo | `undo-redo.ts` (50 estados en sesión) |
| Historial | `page.versions[]` + panel Restaurar |
| Export / Import | `page.json` vía toolbar |
| Medios | `InspectorImagePicker` / `MediaField` en schemas |
| Publicar | API `PUT /api/cms/pages/[id]` con `publish: true` |

## Criterios de aceptación

- [x] Crear/editar página sin código (flujo existente + nuevo studio)
- [x] Arrastrar componentes al canvas (biblioteca + estructura)
- [x] Inspector universal por bloque seleccionado
- [x] Imágenes vía Biblioteca de Medios (schemas + BlockEditor)
- [x] Reordenar bloques (DnD)
- [x] Vista Desktop / Tablet / Mobile en canvas
- [x] Versiones y restaurar (publicación + panel historial)
- [x] Publicar página
- [x] Exportar / importar JSON
- [x] Multi-tenant, Experience Kit, Branding
- [x] `npm run build` ✅

## Roadmap posterior

| OT | Contenido |
| --- | --- |
| BUILD-001B | Migración Home |
| BUILD-001C | Migración Centro de Admisión |
| BUILD-001D–G | Programas, Noticias, Biblioteca, Equipo |
| BUILD-001H | Landing Pages |
| BUILD-002+ | Schemas completos sin BlockEditor legacy |

## Nota estratégica

El Experience Studio vive en `src/lib/experience-studio/` y `src/components/visual-builder/` para facilitar extracción al núcleo AprendeHoy Learning OS en futuras iteraciones.
