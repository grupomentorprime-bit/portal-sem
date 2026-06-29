# Motor de Menús Dinámicos — OT-SEM-CMS-002

Documentación del módulo de navegación dinámica del CMS institucional AprendeHoy.

## Resumen

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-CMS-002 |
| Módulo | CMS — Menu Engine |
| Versión | 1.0 |
| Tag Git | v1.1-menu-engine |
| Colección | `cms_menus` |
| Dependencias | OT-SEM-INFRA-001, OT-SEM-CMS-001 |

## Principio de diseño

> No construir nada específico para el SEM si puede convertirse en un componente reutilizable.

Este motor es **agnóstico de institución**: funciona para SEM, AprendeHoy, OTEC, universidades, iglesias, fundaciones, etc., sin modificar código.

## Arquitectura

```
MongoDB (cms_menus)
        ↓
API /api/cms/menus
        ↓
Panel /admin/menus
        ↓
Portal (header, footer, mobile)
```

## Modelo de datos

### Colección `cms_menus`

Documento por menú. El `_id` es el identificador del menú (ej: `main`, `footer`, `mobile`).

```json
{
  "_id": "main",
  "name": "Menú Principal",
  "location": "header",
  "active": true,
  "items": [],
  "createdAt": "2026-06-29T00:00:00.000Z",
  "updatedAt": "2026-06-29T00:00:00.000Z"
}
```

### Ítem de menú

```json
{
  "id": "home",
  "title": "Inicio",
  "slug": "/",
  "url": "",
  "type": "internal",
  "icon": "house",
  "parent": null,
  "order": 1,
  "visible": true,
  "active": true,
  "target": "_self",
  "nofollow": false,
  "highlighted": false,
  "badge": "",
  "color": "",
  "level": 0
}
```

### Tipos de navegación

`internal`, `external`, `cms_page`, `program`, `category`, `news`, `blog`, `event`

### Ubicaciones soportadas

`header`, `footer`, `mobile`, `sidebar`, `top`, `academic`, `intranet`, `campus`, `library`, `store` (+ personalizadas)

## APIs

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/cms/menus` | Listado de menús |
| POST | `/api/cms/menus` | Crear menú |
| GET | `/api/cms/menus/[id]` | Obtener menú |
| PUT | `/api/cms/menus/[id]` | Actualizar menú |
| DELETE | `/api/cms/menus/[id]` | Eliminar menú |

## Portal público

| Ubicación | Menú `_id` | Componente |
| --- | --- | --- |
| Header | `main` | `SiteHeader` + `NavMenu` |
| Footer | `footer` | `SiteFooter` + `NavMenu` |
| Mobile | `mobile` | `SiteHeader` (drawer) |

Sin menús hardcodeados en el código del portal.

## Componentes reutilizables

| Componente | Función |
| --- | --- |
| `MenuTree` | Árbol jerárquico de ítems |
| `MenuItemEditor` | Editor completo de ítem |
| `MenuPreview` | Vista previa de navegación |
| `MenuLocationSelector` | Selector de ubicación |
| `MenuTypeSelector` | Tipo de enlace |
| `IconSelector` | Selector de iconos |
| `MenuSortableList` | Lista con drag & drop |
| `MenuVisibilitySwitch` | Visible / activo |
| `MenuBadge` | Badge visual |
| `MenuTargetSelector` | Misma / nueva pestaña |
| `NavMenu` | Renderizador público genérico |

## Administración

- **Listado:** `/admin/menus` — CRUD, duplicar, activar/desactivar
- **Editor:** `/admin/menus/[id]` — drag & drop, submenús ilimitados

### Inicialización

Si no existen menús, el panel ofrece **Inicializar menús** con plantilla genérica (`main`, `footer`, `mobile`).

## Caché

- Lectura pública: `unstable_cache` con tag `cms-menus` (60 s)
- Invalidación automática al crear/actualizar/eliminar

## Interfaces TypeScript

Definidas en `src/types/menu.ts`:

- `CmsMenu`, `MenuItem`, `MenuTreeNode`
- `MenuItemType`, `MenuLocation`, `MenuTarget`, `FeatureFlags` (N/A)

## Pruebas

```bash
npm run lint
npm run build
npm run dev
```

1. Inicializar menús en `/admin/menus`
2. Verificar header/footer en `/`
3. Editar ítems con drag & drop
4. Confirmar persistencia en MongoDB

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| CRUD completo | ✅ |
| MongoDB funcionando | ✅ |
| Drag & Drop | ✅ |
| Submenús ilimitados | ✅ |
| Header dinámico | ✅ |
| Footer dinámico | ✅ |
| Mobile dinámico | ✅ |
| Sin menús hardcodeados | ✅ |
| ESLint limpio | ✅ |
| Build exitoso | ✅ |
| Documentación | ✅ |
