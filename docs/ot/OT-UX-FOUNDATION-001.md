# OT-UX-FOUNDATION-001 — Responsive Foundation & Design System

| Atributo | Valor |
| --- | --- |
| OT | OT-UX-FOUNDATION-001 |
| Prioridad | P0 |
| Estado | ✅ Completada |
| Tipo | Capa visual y composición — sin cambios funcionales |

## Objetivo

Construir la base visual definitiva de AprendeHoy: sistema responsive, escalable y reutilizable para todas las páginas del portal.

## Restricciones respetadas

- Sin modificar APIs, CMS, Experience Kit ni lógica de negocio
- Solo capa visual/composición CSS + tokens TypeScript
- Hero Premium LOCKED — layouts responsive vía `foundation/hero.css` (composición)

## Entregables

### Arquitectura CSS — `src/styles/foundation/`

| Archivo | Sistema |
| --- | --- |
| `tokens.css` | Variables base |
| `breakpoints.css` | 6 tiers responsive |
| `spacing.css` | Escala 8–160px |
| `typography.css` | Hero → Caption por breakpoint |
| `containers.css` | XS–XXL + bridge PortalContainer |
| `grid.css` | Grilla 12 columnas |
| `buttons.css` | Alturas, radios, estados |
| `cards.css` | Unificación Experience Kit cards |
| `media.css` | aspect-ratio + object-fit |
| `motion.css` | Fade, slide, scale, reveal, stagger |
| `hero.css` | Layouts por tier (no escalar) |
| `sections.css` | Composición Eyebrow→CTA |
| `utilities.css` | Helpers + bridge footer |

### Breakpoints oficiales

| Tier | Rango | Container max | Padding |
| --- | --- | --- | --- |
| Mobile | <768px | 100% | 16px |
| Tablet | 768–991px | 720px | 24px |
| Tablet XL | 992–1279px | 960px | 24px |
| Laptop | 1280–1439px | 1180px | 32px |
| Desktop | 1440–1919px | 1360px | 32px |
| Desktop XL | ≥1920px | 1560px | 40px |

### Hero layouts

| Tier | Layout |
| --- | --- |
| Mobile | Vertical |
| Tablet | Texto arriba, imagen abajo |
| Tablet XL+ | Split con ratios por tier |
| Laptop | 50% / 50% |
| Desktop | 48% / 52% |
| Desktop XL | 45% / 55% |

### TypeScript

`src/design/tokens/foundation-breakpoints.ts` — tiers, containers, spacing, media ratios.

### Integración

- `globals.css` importa `foundation/index.css` después de `design-tokens.css`
- `home-premium-experience.css` simplificado — delega tokens a foundation
- Bridge automático: `PortalContainer`, header, hero, cards, grids

## Compatibilidad objetivo

1920×1080 · 1600×900 · 1536×864 · 1440×900 · 1366×768 · 1280×720 · iPad Pro · iPad · Galaxy Tab · iPhone · Android

## Verificación

```bash
npx tsc --noEmit
npm run dev
```

Revisar Home en DevTools con presets anteriores.

## Siguiente paso

Aplicar clases `section-f`, `grid-f`, `container-f` en nuevas páginas (Programas, Equipo, Noticias) conforme se desarrollen OTs de página.
