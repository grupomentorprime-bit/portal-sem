# OT-HERO-006 — Modelo de datos definitivo del Hero (CMS First)

## Objetivo

Congelar el **diseño visual** del Hero en código y mover **todo el contenido** al CMS: textos, imágenes, CTAs, tarjetas, fechas, campañas y SEO por slide.

A partir de esta OT, el Hero se trata como **módulo Core de AprendeHoy**, reutilizable en múltiples contextos sin escribir código.

## Estructura del slide

Cada slide es un bloque completamente configurable:

```
HeroSlide
├── content          → eyebrow, title, highlight, subtitle, description
├── multimedia       → desktop/mobile, overlay, alignment
├── actions          → CTA principal y secundario
├── floatingCard     → tarjeta flotante (evento / convocatoria)
├── benefits         → beneficios inferiores
├── institutionalVideo
├── statistics
├── seo              → meta por slide
├── publication      → draft | published | scheduled | archived
├── scheduling       → showFrom, showUntil
├── priority         → principal | featured | normal
└── order            → orden manual (secundario a prioridad)
```

## HeroPortalConfig

```typescript
interface HeroPortalConfig {
  enabled: boolean;
  type: "image" | "carousel" | "video";
  carousel: HeroCarouselSettings;
  context: HeroPlacementContext; // reutilización multi-landing
  slides: HeroSlide[];
}
```

### Contextos de reutilización

| Valor | Uso |
|-------|-----|
| `institutional_portal` | Portal institucional |
| `program_landing` | Landing de programas |
| `course_landing` | Landing de cursos |
| `commercial_landing` | Landing comercial |
| `event` | Eventos |
| `campaign` | Campañas |
| `open_day` | Open Day |

## Publicación y fechas

| Estado | Comportamiento |
|--------|----------------|
| **Borrador** | Solo visible en preview del editor |
| **Publicado** | Visible según ventana de fechas (opcional) |
| **Programado** | Requiere `showFrom`; respeta `showUntil` |
| **Archivado** | Nunca visible |

Ejemplo campaña Admisión 2027:

- `showFrom`: 2027-08-01
- `showUntil`: 2027-10-31
- `publication.status`: `scheduled`

## Prioridad

Orden de visualización:

1. `principal`
2. `featured`
3. `normal`

Dentro de la misma prioridad, aplica `order` manual.

## Archivos principales

| Archivo | Rol |
|---------|-----|
| `src/types/hero-portal.ts` | Tipos definitivos |
| `src/lib/cms/hero-slide-display.ts` | Visibilidad, prioridad, fechas |
| `src/lib/cms/hero-portal-normalize.ts` | Migración desde modelo plano legacy |
| `src/lib/cms/hero-portal-defaults.ts` | Seeds y slides vacíos |
| `src/core/hero/resolve.ts` | Resolución de media + filtro público |
| `src/core/hero/map-slide.ts` | Mapeo a vista Premium (render congelado) |
| `src/components/config/HeroSlideEditor.tsx` | Constructor por secciones |
| `src/components/config/HeroPortalPreview.tsx` | Preview Desktop / Tablet / Mobile / Portal |

## Preview en editor

- **Modo Editor**: muestra todos los slides no archivados (incluye borradores).
- **Modo Publicado**: aplica las mismas reglas que el portal público.
- Viewports: Desktop, Tablet, Mobile, Portal.

## Migración

`normalizeHeroPortal()` convierte automáticamente slides en formato plano (pre-006) al modelo anidado:

- `active: true` → `publication.status: "published"`
- `active: false` → `publication.status: "draft"`
- `titulo` → `content.title`
- `imagenDesktopId` → `multimedia.desktopMediaId`
- etc.

## Fuera de alcance (diseño congelado)

No se agregan nuevas variantes visuales. Los campos `institutionalVideo`, `statistics` y SEO están en el modelo y el editor; el render público los activará en OTs posteriores sin cambiar el contrato de datos.

## Regla de producto

> No agregar más funcionalidades visuales al Hero después de esta OT.
> Diseño = código. Contenido = CMS.
