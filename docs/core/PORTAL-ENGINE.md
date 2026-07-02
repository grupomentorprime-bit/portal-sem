# Portal Engine — CMS Driven Rendering

**Versión:** v2.0.0-portal-engine  
**OT:** OT-CORE-PORTAL-001  
**ADR:** [ADR-007](../architecture/ADR-007.md)

---

## Propósito

El Portal Engine convierte el portal público en un motor de renderizado gobernado exclusivamente por el CMS. La estructura de cada página (incluida la Home) la define `cms_pages.blocks[]`; React no impone orden ni secciones fijas.

---

## Arquitectura

```text
CMS (cms_pages)
      ↓
Page + Blocks
      ↓
Portal Engine (src/core/portal/)
      ↓
PortalRenderer (src/components/portal/PortalRenderer.tsx)
      ↓
PortalBlockSection → Componentes Core UI canónicos (portal/)
```

**Canon oficial:** [CORE-UI-CANON.md](../frontend/CORE-UI-CANON.md) — únicos componentes autorizados para desarrollo público.

**Árbol de componentes:**

```text
src/components/
├── ui/           Primitivos CANONICAL
├── layout/       Layout CANONICAL (fusión OT-006)
├── portal/       Composición pública CANONICAL
├── [internal]/   config, media, menu, page-builder…
└── [deprecated]/ institutional/, blocks/, navigation/
```

---

## Módulos (`src/core/portal/`)

| Módulo | Responsabilidad |
| --- | --- |
| `registry/` | Catálogo de bloques (type, version, component, resolver) |
| `resolver/` | Resolución de datos vía Content Engine (sin Mongo directo en UI) |
| `visibility/` | Evaluación de `visible` + condiciones |
| `renderer/load-page.ts` | Carga de páginas publicadas y orden de bloques |
| `seo/` | Consolidación de metadata y JSON-LD |
| `events/` | `PageViewed`, `BlockRendered`, `CTAViewed` → Event Bus |
| `layout/` | Separación Layout → Portal → Bloques |

---

## Block Registry

Cada bloque registrado incluye:

```ts
{
  type: BlockType;
  version: number;
  name: string;
  category: string;
  component: string;   // componente UI
  resolver?: string;   // clave del resolver de contenido
  queryDriven?: boolean;
}
```

Consultar: `listBlockDefinitions()` desde `@/core/portal`.

---

## Renderizado

```ts
import { PortalRenderer } from "@/components/portal/PortalRenderer";
import { loadHomePage } from "@/core/portal";

const page = await loadHomePage(tenantId);
return <PortalRenderer page={page} ctx={portalContext} />;
```

`PortalHome` es solo un contenedor que delega al renderer.

---

## Orden de bloques

Exclusivamente desde `cms_pages.blocks[]`, ordenados por `block.order`. Sin posiciones fijas en React.

---

## Condiciones de visibilidad

En `block.settings.conditions`:

```ts
{
  roles?: ("guest" | "student" | "teacher" | "admin")[];
  featureFlag?: keyof FeatureFlags;
  dateFrom?: string;
  dateTo?: string;
  language?: string;
  tenantIds?: string[];
}
```

Evaluadas por `evaluateBlockVisibility()` antes del render.

---

## Resolvers

Los bloques query-driven (`programs`, `teachers`, `news`, …) obtienen datos mediante:

```ts
resolveBlockData(block, tenant) → resolveBlockContent() → Content Engine
```

Los componentes UI no consultan MongoDB directamente.

---

## Asset Engine

Medios resueltos con `resolveMediaRef()` / `resolveBlockMedia()` desde `@/core/media`.

---

## Eventos (Analytics)

| Evento | Cuándo |
| --- | --- |
| `PageViewed` | Al renderizar una página |
| `BlockRendered` | Por cada bloque visible |
| `CTAViewed` | Al renderizar bloque `cta` |

Publicados vía Event Bus (`@/core/events`).

---

## SEO

`consolidatePageSeo()` agrega:

- Título y descripción (página + config)
- JSON-LD: `EducationalOrganization`, `FAQPage` (si hay bloque FAQ)
- Open Graph básico

---

## Páginas que usan el engine

| Ruta | Componente |
| --- | --- |
| `/` | `PortalHome` → `PortalRenderer` |
| `/[slug]` | `PortalRenderer` |
| Páginas CMS (`PortalCmsPage`) | `PortalRenderer` |

---

## Compatibilidad

Todos los tipos de bloque existentes en `BLOCK_TYPES` están registrados. Páginas publicadas antes de esta OT siguen funcionando; el orden depende de sus bloques en MongoDB.

### Page Builder Preview

El preview del editor (`page-builder/BlockRenderer`) migra progresivamente hacia componentes canónicos de `portal/` (OT-CORE-UI-002). La capa `blocks/` permanece como DEPRECATED hasta Core UI v2.0.

| Bloque preview | Componente canónico (post OT-002) |
| --- | --- |
| hero | HeroPremiumSection |
| cta | PortalCTA |
| stats | StatsSectionContent |
| verse | VerseSectionContent |
| teachers | TeachersSectionContent |
| conversion blocks | portal/conversion/* |

---

## Validación

```bash
npm run lint
npm run build
```
