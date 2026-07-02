# Content Engine — OT-SEM-CMS-004

Motor de contenidos dinámicos del Portal Institucional SEM (AprendeHoy Learning OS).

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-CMS-004 |
| Versión | 1.2.0 |
| Tag Git | v1.2-content-engine |
| Arquitectura | ARQ-003 |

## 1. Objetivo

Permitir que cualquier bloque dinámico del CMS consulte información desde colecciones MongoDB mediante consultas configurables, **sin almacenar datos de negocio en `cms_pages`**.

## 2. Flujo arquitectónico

```
React (Web / Preview)
        ↓
POST /api/cms/content-query
        ↓
Content Engine (src/lib/content)
        ↓
MongoDB Atlas
        ↓
Mappers → ProgramCard / NewsCard / …
```

En **Server Components** públicos, el motor se invoca directamente vía `resolvePageBlocks()` (misma lógica que la API, sin round-trip HTTP).

Regla ARQ-003: **nunca** React → MongoDB. Siempre API o servicio servidor.

## 3. Módulo `src/lib/content`

| Archivo | Responsabilidad |
| --- | --- |
| `types.ts` | Colecciones permitidas, límites, tipos internos |
| `validation.ts` | Validación de consultas entrantes |
| `filters.ts` | Construcción de filtros Mongo seguros |
| `sort.ts` | Ordenamiento ASC/DESC en campos permitidos |
| `pagination.ts` | page, limit, total, pages |
| `cache.ts` | Caché por colección con TTL configurable |
| `resolver.ts` | `ContentResolver` — ejecuta consultas |
| `query.ts` | Exportaciones públicas del motor |
| `mappers.ts` | Documentos → modelos de tarjeta UI |
| `block-query-defaults.ts` | Queries por defecto por tipo de bloque (client-safe) |
| `block-queries.ts` | Resolución server-side de bloques |
| `seed.ts` | Seeds mínimos de colecciones |

## 4. API

### `POST /api/cms/content-query`

**Request:**

```json
{
  "tenant": "seminario-ipn",
  "collection": "academy_programs",
  "filters": { "featured": true },
  "sort": { "field": "order", "direction": "asc" },
  "pagination": { "limit": 6, "page": 1 }
}
```

**Response:**

```json
{
  "ok": true,
  "items": [],
  "total": 6,
  "page": 1,
  "pages": 1,
  "limit": 6
}
```

### `GET /api/cms/content-query`

Parámetros: `tenant`, `collection`, `featured`, `category`, `limit`, `page`, `sortField`, `sortDirection`, `preview`, `raw`.

### `POST /api/cms/content-seed`

Inicializa colecciones con datos demo para un tenant.

## 5. Colecciones oficiales

- `academy_programs`
- `academy_categories`
- `academy_teachers`
- `academy_team`
- `academy_testimonials`
- `academy_gallery`
- `content_news`
- `content_news_categories`
- `content_events`
- `content_library`

## 6. Esquema de bloques

**Antes:** `settings.items: []` embebido en la página.

**Ahora:**

```json
{
  "type": "programs",
  "settings": {
    "title": "Nuestros programas",
    "query": {
      "collection": "academy_programs",
      "featured": true,
      "limit": 6,
      "sort": { "field": "order", "direction": "asc" }
    }
  }
}
```

Los `items` resueltos **no se persisten** — se generan en render vía Content Engine.

## 7. Bloques integrados

| Bloque | Colección por defecto |
| --- | --- |
| programs | academy_programs |
| teachers | academy_team |
| news | content_news |
| events | content_events |
| library | content_library |
| testimonials | academy_testimonials |
| gallery | academy_gallery |

## 8. Panel administrativo

- `/admin/content` — Hub de contenido
- `/admin/content/programs`, `/news`, `/team`, `/library`, `/events`, `/testimonials`, `/gallery`, `/categories`

El **Page Builder** incluye panel **Origen de datos** (colección, filtros, orden, cantidad, categoría, tags, destacados, estado).

## 9. Seguridad

- Whitelist de colecciones
- Whitelist de filtros y campos de orden
- Límite máximo: 50 documentos por consulta
- Tenant obligatorio en toda consulta
- Sanitización de strings y bloqueo de operadores Mongo peligrosos
- Solo contenido `published` en sitio público

## 10. Caché

TTL por colección (segundos):

| Colección | TTL |
| --- | --- |
| academy_programs | 120 |
| content_news | 60 |
| academy_team | 180 |
| content_events | 90 |
| content_library | 120 |

Invalidación vía `revalidateContentCache(collection, tenant)`.

## 11. Modelos TypeScript compartidos

`src/types/content.ts`:

- `ProgramItem`, `NewsItem`, `TeacherItem`, `EventItem`, `LibraryItem`, `GalleryItem`
- `ContentQuery`, `ContentResult`, `BlockContentQuery`
- `ContentDocument`, `CategoryItem`

Preparados para reutilización en **Expo / React Native** consumiendo la misma API.

## 12. Integración futura Expo

```typescript
const res = await fetch("https://portal.sem/api/cms/content-query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tenant: "seminario-ipn",
    collection: "academy_programs",
    filters: { featured: true },
    pagination: { limit: 6 },
  }),
});
const { items } = await res.json();
// Renderizar con ProgramCard nativo + mismos tipos
```

## 13. Buenas prácticas

1. No duplicar contenido en páginas — solo configurar `query`.
2. CRUD de contenido en colecciones oficiales (OTs NEWS, PROGRAMS, etc.).
3. Usar seeds solo en desarrollo/demo.
4. Respetar estado editorial: draft solo en admin/preview.
5. Diseñar nuevos bloques dinámicos con `query` desde el inicio.

## 14. Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Sin datos de negocio en bloques persistidos | ✅ |
| Contenido desde MongoDB | ✅ |
| BlockRenderer vía Content Engine | ✅ |
| API /api/cms/content-query | ✅ |
| Alineado ARQ-003 | ✅ |
| Preparado para Expo | ✅ |
| lint + build OK | ✅ |
