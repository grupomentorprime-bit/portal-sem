# Platform Admin: vistas Lista y Kanban de Espacios

En Growth OS (`/platform`), el catálogo de Espacios ofrece dos lecturas del mismo conjunto filtrado: **Lista** (tabla densa) y **Kanban** (tablero por estado operativo). El filtro por tipo de organización y la búsqueda siguen aplicando a ambas vistas.

## Decisiones

- Kanban agrupa por **estado del Espacio**, no por tipo.
- Columnas fijas y siempre visibles, en este orden: **Activo → Inactivo → Suspendido → Archivado**.
- El select **Todos los tipos** permanece en la barra y filtra tarjetas/filas en ambas vistas.
- Sin drag & drop en esta iteración: cambiar estado sigue siendo vía menú de acciones (`⋯`).
- Preferencia de vista en estado React de sesión (sin persistencia en `localStorage` / URL por ahora).
- Sin API nueva: se reutiliza `PlatformSpaceListItem[]`.

## Comportamiento

### Lista

- Filas densas existentes: organización, sitio, subdominio/dominio propio, miembros, estado, acciones.
- Mantiene “Ver espacio”, menú de acciones y fila inferior “Agregar organización”.

### Kanban

- Recibe el mismo arreglo `filtered` que la lista.
- Cada columna muestra: etiqueta de estado, tono visual acorde al estado, contador.
- Columna vacía: contador `0` + placeholder corto (“Sin espacios”).
- Tarjeta liviana: nombre, badge de tipo, dominio (o subdominio), conteo de miembros, CTA “Ver espacio”, menú `⋯`.
- El estado no se repite como badge en la tarjeta (ya lo define la columna).

### Vacío global

- Sin Espacios en plataforma → EmptyState “Sin Espacios” + Crear Espacio.
- Con filtros/búsqueda sin matches → EmptyState “Sin resultados”.

## Componentes

| Pieza | Rol |
|-------|-----|
| `PlatformSpacesCatalog` | Toolbar (búsqueda, filtro tipo, toggle Lista/Kanban, Crear Espacio); elige vista |
| `PlatformSpacesKanban` | Tablero de 4 columnas por `status` |
| `PlatformSpaceActionsMenu` | Acciones de estado/borrado (sin cambios de contrato) |
| `PlatformCreateSpacePanel` | Modal de creación (sin cambios de contrato) |

## Datos

- Fuente: `PlatformSpaceListItem` (`status`, `statusLabel`, `type`, `typeLabel`, dominio, sitio, miembros, etc.).
- Flujo: `spaces` → `query` + `typeFilter` → `filtered` → Lista o Kanban.
- Etiquetas de columna alineadas con `labelTenantStatus` / `statusLabel` existentes.

## Fuera de alcance

- Drag & drop para cambiar estado.
- Persistencia de vista entre sesiones.
- Agrupación kanban por tipo (reemplazada por filtro).
- Paginación / virtualización (volumen actual bajo).

## Testing

Baseline de fuente (sin E2E obligatorio):

- Toggle Lista / Kanban presente en `PlatformSpacesCatalog`.
- `PlatformSpacesKanban` agrupa por estados `active | inactive | suspended | archived`.
- Filtro por tipo permanece en el catálogo.
- Lenguaje visible: Espacio / Sitio; sin `Tenant` / `super_admin` en UI del catálogo.
