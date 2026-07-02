# OT-CMSV2-COMPONENTS-001 — Biblioteca de Inspectores del Visual Experience Builder

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-COMPONENTS-001 |
| Épica | EP-001A — Portal CMS |
| Dependencia | [OT-CMSV2-DESIGN-001](./OT-CMSV2-DESIGN-001.md) |
| Prioridad | Muy alta |
| Estado | Completada |
| Documentación | [VISUAL-BUILDER-INSPECTOR.md](../design/VISUAL-BUILDER-INSPECTOR.md) |

## Objetivo

Construir la biblioteca oficial de componentes del Inspector del Visual Experience Builder, reutilizable por todos los bloques del Portal y, posteriormente, por AprendeHoy.

**No** se implementan bloques (Hero, Programas, etc.). Solo la infraestructura reutilizable del panel lateral.

## Entregables

| Entregable | Ubicación | Estado |
| --- | --- | --- |
| Shell del panel | `InspectorPanel`, `InspectorToolbar`, `InspectorFooter` | ✅ |
| Secciones canónicas | `InspectorSection`, `InspectorAccordion` | ✅ |
| Campos de formulario | `inspector/fields/*` | ✅ |
| Selectores de medios | `inspector/media/*` | ✅ |
| Controles de layout | `inspector/layout/*` | ✅ |
| Primitivos compartidos | `inspector/shared/*` | ✅ |
| Barrel export | `visual-builder/index.ts` | ✅ |
| Documentación de diseño | `docs/design/VISUAL-BUILDER-INSPECTOR.md` | ✅ |

## Arquitectura

```
src/components/visual-builder/
└── inspector/
    ├── InspectorPanel.tsx
    ├── InspectorSection.tsx
    ├── InspectorAccordion.tsx
    ├── InspectorToolbar.tsx
    ├── InspectorFooter.tsx
    ├── fields/       (11 componentes)
    ├── media/        (3 componentes)
    ├── layout/       (5 componentes)
    └── shared/       (Label, Hint, Divider, Empty, Actions, FieldFrame)
```

## Anatomía obligatoria

Orden fijo de secciones en todo inspector de bloque:

1. Contenido
2. Multimedia
3. Diseño
4. Visibilidad
5. Configuración
6. Acciones

Definido en `INSPECTOR_SECTION_ORDER` y `INSPECTOR_SECTION_LABELS`.

## Integraciones

- **Biblioteca Institucional** — `InspectorImagePicker`, `InspectorVideoPicker`, `InspectorGalleryPicker` usan `MediaField` / `MediaPicker`. Sin URL ni file input nativo.
- **Experience Kit** — `Button`, `Input`, `Select`, `Accordion`, `Drawer`, tokens de marca.
- **CMS-UX-GUIDELINES** — Lenguaje institucional, sin jerga técnica.

## Responsive

| Viewport | Comportamiento |
| --- | --- |
| Escritorio | Panel fijo lateral |
| Tablet | Drawer |
| Móvil | Drawer pantalla completa |

## Criterios de aceptación

- [x] Biblioteca completa de componentes del Inspector creada
- [x] Componentes reutilizables y desacoplados de bloques específicos
- [x] Integración con Biblioteca Institucional para medios
- [x] Compatible con Experience Kit y CMS-UX-GUIDELINES
- [x] Sin dependencias de Hero, Programas, Noticias u otros bloques
- [x] `npm run build` ✅
- [x] `npm run check:branding` ✅

## Siguiente OT

**OT-CMSV2-BUILD-001A** — Núcleo del Visual Experience Builder: layout de tres columnas (estructura | canvas | inspector) reutilizando esta biblioteca.

## Objetivo estratégico

Estandarizar cómo se editan los bloques — del mismo modo que el Experience Kit estandariza botones, tarjetas e inputs — para que Hero, Programas, Noticias, Biblioteca, CTA y componentes futuros compartan la misma experiencia de edición.
