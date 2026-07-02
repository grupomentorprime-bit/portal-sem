# OT-CMSV2-001A — Unificación del Shell

| Atributo | Valor |
| --- | --- |
| OT | OT-CMSV2-001A |
| Épica padre | OT-CMSV2-001 — Centro de Administración Institucional |
| Versión | 1.0.0 |
| Prioridad | Alta |
| Estado | Completada (Sprint 1) |
| Fecha | 2026-07-01 |

## Objetivo

Unificar toda la experiencia administrativa bajo el **Centro de Administración**, de modo que el usuario perciba una sola aplicación y no distintos sistemas técnicos.

## Alcance Sprint 1

| Pantalla | Cambio |
| --- | --- |
| Shell global | `AdminInstitutionalHeader` (ya en OT-CMSV2-001) |
| `AdminModuleLayout` | Breadcrumbs, título editorial, sidebar, acciones |
| Dashboard `/admin` | Widgets: estado portal, noticias, programas, invitaciones, actividad |
| Configuration Hub | Migrado a `AdminModuleLayout`; “Institución > Configuración general” |
| Content Hub | **Centro editorial** con tarjetas y acciones rápidas |
| Media Library | **Biblioteca de medios** sin header duplicado |
| Páginas del portal | `PageListClient` unificado |
| Listados de contenido | `ContentListClient` con breadcrumbs |
| Manual UX | [CMS-UX-GUIDELINES.md](../design/CMS-UX-GUIDELINES.md) |

## Arquitectura

```
AdminShell
├── AdminInstitutionalHeader (global)
└── AdminModuleLayout (por módulo)
    ├── Breadcrumb
    ├── Título + acciones
    ├── Sidebar (opcional)
    └── Contenido
```

Capa de lenguaje: `src/lib/admin/institutional.ts`

## UX

Ver [CMS-UX-GUIDELINES.md](../design/CMS-UX-GUIDELINES.md).

## Componentes nuevos / modificados

- `src/components/admin/AdminModuleLayout.tsx` — **nuevo**
- `src/components/config/ConfigurationLayout.tsx` — migrado
- `src/components/content/ContentHubClient.tsx` — migrado
- `src/components/content/ContentListClient.tsx` — migrado
- `src/components/media/MediaLibraryClient.tsx` — migrado
- `src/components/page-builder/PageListClient.tsx` — migrado
- `src/components/admin/AdminDashboardClient.tsx` — widgets ampliados
- `src/components/admin/AdminPageFrame.tsx` — usa `AdminModuleLayout`

## Términos eliminados en UI

Configuration Hub, Content Hub, Media Manager, Content Engine, Tenant (visible), Identity Core, Feature (como etiqueta), Inicializar CMS.

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Un solo header global en admin | ✅ |
| Configuration sin header duplicado | ✅ |
| Content como Centro editorial | ✅ |
| Media como Biblioteca de medios | ✅ |
| Dashboard con widgets institucionales | ✅ |
| Breadcrumbs en módulos migrados | ✅ |
| Manual CMS-UX-GUIDELINES publicado | ✅ |

## Siguiente fase (OT-CMSV2-002)

- Búsqueda global con indexación
- Notificaciones, 2FA, sesiones, foto de perfil
- Unificar page builder individual (`/admin/pages/[id]`) → ver [OT-CMSV2-DESIGN-001](./OT-CMSV2-DESIGN-001.md)
- Unificar hubs secundarios (workflows, events → lenguaje institucional)

## Documentación

| Documento | Acción |
| --- | --- |
| CMS-UX-GUIDELINES.md | Creado |
| OT-CMSV2-001A.md | Creado |
| OT-CMSV2-001.md | Referencia cruzada |
