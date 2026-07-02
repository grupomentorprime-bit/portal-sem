# CORE NEWS GRID v1.0

**Estado:** LOCKED

Módulo oficial de Noticias de AprendeHoy. No es un listado exclusivo del SEM; consume `content_news` sin duplicar contenido.

## Principio

Un único News Module para toda la plataforma. No existen grids de noticias por tenant ni por sección.

## Casos de uso

| Contexto | Ejemplos |
| --- | --- |
| SEM | Noticias institucionales, comunicados, actividades |
| Universidad | Noticias, investigación, vida universitaria |
| OTEC | Cursos nuevos, convenios, certificaciones |
| Empresa | Blog, comunicados, novedades |

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalNewsGrid` | Sección con header + grid responsive |
| `PortalNewsCard` | Tarjeta de noticia |
| `PortalNewsImage` | Media con lazy, skeleton, alt obligatorio |
| `PortalNewsMeta` | Categoría, fecha, autor, tiempo de lectura |
| `PortalNewsCTA` | Enlace «Leer más →» |
| `PortalNewsSkeleton` | Loading idéntico al grid |

Ruta: `src/components/portal/experience/news-grid/`

## Contrato CMS — bloque `news`

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string |
| `title` | string |
| `description` | string |
| `showButton` | boolean |
| `buttonLabel` | string |
| `buttonHref` | string |
| `cardCtaLabel` / `readMoreLabel` | string |
| `query` | BlockContentQuery → `content_news` |

### Query (`content_news`)

| Filtro | Descripción |
| --- | --- |
| `status: published` | Solo publicadas (resolver) |
| `featured` | Opcional |
| `category` | Opcional |
| `tags` | Opcional |
| `limit` | Cantidad (default 3) |
| `sort` | `publishedAt` desc |

### Tarjeta (desde CMS)

| Campo | Origen |
| --- | --- |
| `image` | media / imagen |
| `category` | categoría |
| `date` | `publishedAt` |
| `title` | título |
| `excerpt` | resumen |
| `readTime` | estimado desde contenido |
| `author` | autor |
| `href` | slug |
| `featured` | destacado |

Estados de contenido: `published`, `featured`, `scheduled`, `archived` — el resolver público solo expone `published`.

## Layout responsive

| Breakpoint | Columnas |
| --- | --- |
| Mobile (&lt;768px) | 1 |
| Tablet / Notebook (≥768px) | 2 |
| Desktop (≥1280px) | 3 |

## Animaciones (LOCKED)

- Sección: fade-up
- Cards: stagger entrada
- Hover: elevación suave
- Imagen: zoom 1.05
- `prefers-reduced-motion`: sin animaciones

## Tokens

Solo design tokens oficiales. Sin `--sem-*` ni textos fijos en componentes.

## Archivos Core (no tocar sin OT)

| Área | Archivo |
| --- | --- |
| Tipos | `src/types/news-grid.ts` |
| Estilos | `src/styles/news-grid.css` |
| Bloque CMS | `src/components/portal/blocks/NewsBlockSection.tsx` |
| Mapper | `src/components/portal/experience/news-grid/mappers.ts` |

## Deprecaciones

| Componente | Reemplazo |
| --- | --- |
| `NewsSectionContent` | `PortalNewsGrid` |
| `NewsCard` | `PortalNewsCard` |
| `NewsGrid` (blocks) | `PortalNewsGrid` |

## Experience Modules — roadmap

```
✅ Hero (LOCKED)
✅ Catalog Card (LOCKED)
✅ Feature Grid v1.0
✅ Timeline v1.0 (LOCKED)
✅ News Grid v1.0 (este documento)
⏳ Teachers Grid (OT-PORTAL-006)
⏳ CTA Premium (OT-PORTAL-007)
⏳ Contact Module (OT-PORTAL-008)
⏳ Footer Premium (OT-PORTAL-009)
```

## OTs

- OT-PORTAL-005 — News Grid v1.0 (este documento)
