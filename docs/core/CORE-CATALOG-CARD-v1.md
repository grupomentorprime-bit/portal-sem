# CORE CATALOG CARD v1.0

**Estado:** LOCKED

Tarjeta canónica del catálogo AprendeHoy. Un único componente para programas, cursos, diplomados, licenciaturas, especializaciones, resultados de búsqueda y landings — sin variantes por tenant ni por tipo de contenido.

## Principio

No existen tarjetas de Programas, Cursos ni Diplomados. Existe **PortalCatalogCard**.

## Contrato de datos

| Propiedad | Tipo | Origen |
| --- | --- | --- |
| `image` | `string?` | CMS / media |
| `title` | `string` | CMS |
| `description` | `string?` | CMS |
| `badge` | `string?` | CMS |
| `category` | `string?` | CMS |
| `modality` | `string?` | CMS |
| `duration` | `string?` | CMS |
| `level` | `string?` | CMS |
| `color` | `string?` | CMS (acento de marca) |
| `url` | `string` | CMS |
| `featured` | `boolean?` | CMS |
| `comingSoon` | `boolean?` | CMS |
| `disabled` | `boolean?` | CMS — no renderiza en público |

Tipos: `src/types/catalog-card.ts`

## Variantes

| Variante | Uso |
| --- | --- |
| `default` | Listados estándar, grids |
| `featured` | Destacados, borde premium |
| `compact` | Buscador global, resultados densos |
| `horizontal` | Sliders, carruseles |
| `minimal` | Móvil, listas simplificadas |

## Estados

| Estado | Comportamiento |
| --- | --- |
| Loading | `PortalCatalogCardSkeleton` |
| Empty | No renderiza card (`disabled: true`) |
| Coming Soon | Badge «Próximamente», CTA no enlazado |
| Disabled | `return null` |

## Responsive

| Breakpoint | Ancho máximo card |
| --- | --- |
| Desktop (≥1400px) | 320px |
| Notebook (1024–1399px) | 300px |
| Tablet / Mobile | 100% del contenedor |

En grids de página (`className="w-full max-w-none"`) la card ocupa el 100% de la celda.

## Hover (LOCKED)

- Imagen: `scale(1.05)`
- Card: `translateY(-6px)` + `shadow-xl`
- CTA: accent glow vía `--catalog-accent`

## Tokens

Solo design tokens oficiales (`--primary`, `--secondary`, `--catalog-accent`, etc.). Prohibido: `--sem-*`, hex hardcodeados, colores fijos por institución.

## Archivos Core (no tocar sin OT)

| Área | Archivos |
| --- | --- |
| Tipos | `src/types/catalog-card.ts` |
| Componentes | `src/components/portal/catalog/*` |
| Estilos | `src/styles/catalog-card.css` |
| Mapper programa | `src/components/portal/catalog/mappers.ts` |

## Subcomponentes

| Componente | Rol |
| --- | --- |
| `PortalCatalogCard` | Tarjeta principal |
| `PortalCatalogBadge` | Badge categoría / estado |
| `PortalCatalogImage` | Media con lazy, skeleton, alt obligatorio |
| `PortalCatalogMeta` | Modalidad, duración, nivel |
| `PortalCatalogCTA` | Enlace «Más información →» |
| `PortalCatalogCardSkeleton` | Loading idéntico a la card |

## Deprecaciones

| Componente | Reemplazo |
| --- | --- |
| `ProgramHighlightCard` | `PortalCatalogCard` |
| `ProgramCard` (portal) | `PortalCatalogCard` |
| `ProgramBadge` | `PortalCatalogBadge` |
| `ProgramCardImage` | `PortalCatalogImage` |
| `ProgramCTA` | `PortalCatalogCTA` |

## Permitido

- Corrección de bugs
- Rendimiento (LCP, CLS, lazy loading)
- Accesibilidad (ARIA, focus, contraste AA)

## No permitido

- Variantes visuales por tenant
- Textos fijos en el componente (todo desde CMS / props)
- Duplicar la tarjeta bajo otro nombre
- Modificar hover, layout base o estructura HTML sin OT

## Relación con Core UI

- Compatible con **Hero Premium v1.0** (LOCKED)
- Usado en `PortalProgramsSection` (Oferta Académica), `ProgramsSectionContent`, `ProgramsPageContent`
- Próximos consumidores: buscador, categorías, landings, «También podría interesarte…»

## OTs

- OT-PORTAL-001 — Oferta Académica (origen del highlight card)
- OT-PORTAL-002 — Portal Catalog Card v1.0 (este documento)
