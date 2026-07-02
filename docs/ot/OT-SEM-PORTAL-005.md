# OT-SEM-PORTAL-005 — Ecosistema Académico y Comunidad

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-005 |
| Versión | 2.3.0 |
| Prioridad | Alta |
| Estado | Completada |

## Objetivo

Construir el bloque **Ecosistema Académico**, mostrando que el SEM es una comunidad activa y en constante crecimiento. Todo el contenido se administra desde el CMS mediante el Content Engine, sin datos hardcodeados.

## Arquitectura

```text
PortalHome
      │
      ▼
AcademicEcosystemSection
      │
      ├── NewsSectionContent
      ├── EventsSectionContent
      ├── LibrarySectionContent
      └── ResourcesSectionContent
      │
      ▼
Content Engine / Page Builder
      │
      ▼
MongoDB (content_news, content_events, content_library)
```

Sin colecciones nuevas. Recursos destacados vía bloque `resources` (Page Builder).

## Secciones implementadas

| # | Sección | Bloque CMS | Fuente de datos |
| --- | --- | --- | --- |
| 1 | Noticias | `news` | Content Engine → `content_news` |
| 2 | Próximos eventos | `events` | Content Engine → `content_events` |
| 3 | Biblioteca | `library` | Content Engine → `content_library` |
| 4 | Recursos destacados | `resources` | `items[]` inline en bloque |

## Diseño UX

### Noticias

- 1 noticia principal destacada + 3 secundarias (desktop).
- Lista vertical / carrusel en mobile.
- Imagen, categoría, fecha, título, resumen, CTA «Leer más».
- URLs: `/noticias/{slug}`.

### Eventos

- Timeline vertical en desktop, tarjetas apiladas en mobile.
- Fecha, nombre, lugar/modalidad, hora, imagen opcional, CTA «Ver evento».
- URLs: `/eventos/{slug}`.

### Biblioteca

- Grid de 4 recursos en desktop, 1 columna en mobile.
- Portada, tipo, título, descripción breve, CTA.
- URLs: `/biblioteca/{slug}`.

### Recursos destacados

- Bloque configurable (clase abierta, sermón, devocional, guía, video institucional).
- Administrable desde Page Builder (`resources.settings.items`).

## Componentes

| Archivo | Rol |
| --- | --- |
| `AcademicEcosystemSection.tsx` | Orquestador server (Content Engine + settings) |
| `ecosystem/EcosystemSectionContent.tsx` | UI de las 4 subsecciones |
| `AcademicEcosystemSectionSkeleton.tsx` | Loading skeleton |
| `cards/NewsCard.tsx` | Variantes `featured` y `compact` |
| `cards/EventCard.tsx` | Variantes `timeline` y `card` |
| `cards/LibraryCard.tsx` | Recursos biblioteca |
| `cards/ResourceCard.tsx` | Recursos destacados (Page Builder) |
| `cards/CardMedia.tsx` | Imagen segura + placeholder |
| `blocks/NewsGrid.tsx` | Page Builder → portal |
| `blocks/EventsGrid.tsx` | Page Builder → portal |
| `blocks/LibraryGrid.tsx` | Page Builder → portal |
| `blocks/ResourcesGrid.tsx` | Page Builder → portal |

## Helpers y tipos

- `splitNewsItems()` — separa noticia destacada y secundarias.
- `extractResources()` — items del bloque `resources`.
- Tipos extendidos: `NewsItem.featured`, `EventItem.time`, `LibraryItem.resourceType`.

## Estados

- **Loading:** `AcademicEcosystemSectionSkeleton` + skeletons por subsección.
- **Vacío:** `PortalEmptyState` institucional por subsección.
- **Error:** mensaje elegante sin romper layout.

## Accesibilidad y SEO

- Alt obligatorios en imágenes.
- Focus visible y navegación por teclado.
- Contraste WCAG AA.
- Slugs amigables preparados para páginas internas futuras.

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md)
- [OT-SEM-PORTAL-004](./OT-SEM-PORTAL-004.md)
