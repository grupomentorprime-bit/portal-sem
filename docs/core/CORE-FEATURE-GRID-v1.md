# CORE FEATURE GRID v1.0

**Estado:** v1.0 — Experience Module

Módulo reutilizable del catálogo Experience Modules de AprendeHoy. No es un bloque fijo «¿Por qué estudiar aquí?»; el copy y las features son 100% administrables desde CMS.

## Principio

Un solo grid de características para cualquier tenant:

| Tenant | Ejemplo de título |
| --- | --- |
| SEM | ¿Por qué estudiar con nosotros? |
| OTEC | ¿Por qué capacitarse aquí? |
| Universidad | ¿Por qué elegir esta carrera? |
| Empresa | ¿Por qué elegir nuestros servicios? |

## Componentes

| Componente | Rol |
| --- | --- |
| `PortalFeatureGrid` | Sección con header + grid responsive |
| `PortalFeatureCard` | Icono, título, descripción |
| `PortalFeatureGridSkeleton` | Loading idéntico al grid |

Ruta: `src/components/portal/experience/feature-grid/`

## Contrato CMS — bloque `feature_grid`

### Sección

| Campo | Tipo |
| --- | --- |
| `overline` | string |
| `title` | string |
| `description` | string |
| `emptyTitle` | string |
| `emptyDescription` | string |

### Cada feature (`features[]`)

| Campo | Tipo | Notas |
| --- | --- | --- |
| `title` | string | Requerido |
| `description` | string | |
| `icon` | string | Nombre Lucide / BlockIcon |
| `color` | string | Acento → `--feature-accent` |
| `order` | number | Orden ascendente |
| `visible` | boolean | `false` oculta la tarjeta |
| `url` | string | Opcional — card enlazable |

Compatibilidad legacy: el bloque `presentation` lee `highlights[]` con el mismo shape (sin `color`, `order`, `visible`, `url`).

## Layout responsive

| Breakpoint | Columnas |
| --- | --- |
| Mobile (&lt;768px) | 1 |
| Tablet (≥768px) | 2 |
| Notebook (≥1024px) | 2 |
| Desktop (≥1280px) | 4 |

Cantidades soportadas: **3, 4, 6, 8, 12** (modifiers `--count-3`, `--count-6` en desktop).

## Estructura de tarjeta

```
┌─────────────────┐
│ ICONO           │
│ Título          │
│ Descripción     │
└─────────────────┘
```

Sin textos fijos en componentes. Todo desde props / CMS.

## Tokens

Solo design tokens (`--feature-accent`, `--secondary`, `--border`, etc.). Prohibido `--sem-*` y colores hardcodeados.

## Archivos

| Área | Archivo |
| --- | --- |
| Tipos | `src/types/feature-grid.ts` |
| Estilos | `src/styles/feature-grid.css` |
| Bloque CMS | `src/components/portal/blocks/FeatureGridBlockSection.tsx` |
| Extractor | `src/components/portal/experience/feature-grid/extract.ts` |

## Deprecaciones

| Componente | Reemplazo |
| --- | --- |
| `FeatureCard` | `PortalFeatureCard` |
| `WhyStudySectionContent` | `PortalFeatureGrid` (vía `presentation` legacy) |
| Bloque `presentation` | Bloque `feature_grid` |

## Experience Modules — roadmap

```
✅ Hero (LOCKED)
✅ Catalog Card (LOCKED)
✅ Feature Grid v1.0
✅ Timeline v1.0
⏳ News Grid (OT-PORTAL-005)
⏳ Agenda (OT-PORTAL-006)
⏳ Teachers (OT-PORTAL-007)
⏳ CTA Premium (OT-PORTAL-008)
```

## OTs

- OT-PORTAL-003 — Feature Grid v1.0 (este documento)
