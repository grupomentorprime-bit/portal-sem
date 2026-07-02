# OT-SEM-PORTAL-002 — Refinamiento Visual Premium

| Atributo | Valor |
| --- | --- |
| OT | OT-SEM-PORTAL-002 |
| Versión | 1.5.0 |
| Prioridad | Alta |
| Estado | Completada |
| Enfoque | Pulido visual Header + Hero + Home (sin nuevas funcionalidades) |

## Objetivo

Elevar la percepción de la Home a nivel institución de alto calibre: diseño serio, moderno y confiable. **No agrega funcionalidades** ni nuevas dependencias.

## Alcance implementado

### 1. Header (88–96 px)

- Altura `--portal-header-height`: 88 px (5.5 rem) → 96 px (6 rem) en desktop.
- Grid de 3 columnas en XL: marca | nav centrado | CTAs.
- Logo SEM más protagonista (`PortalBrandMark`).
- Separador IPN/SEM con gradiente vertical.
- Links con línea inferior animada (`.portal-nav-link`).
- CTA **Postular ahora** con degradado institucional (`.portal-btn-apply`).
- **Ingresar** sobrio (`.portal-btn-login`).
- Transición de scroll más suave (`--transition-slow`).

### 2. Hero

- Layout 42/58 en desktop; imagen más grande a la derecha.
- `PortalHeroMedia`: marco redondeado, sombras, overlay, placeholder elegante sin imágenes rotas.
- Elementos decorativos: orbes, grid lines, gradientes (tokens CSS).
- Título `text-display-xxl`, subtítulo legible, CTAs diferenciados.
- `PortalHeroBenefits` con iconografía unificada (`.portal-icon-badge`).

### 3. Tipografía y espaciado

- Secciones con `text-display-l` (H2).
- Grids y secciones en múltiplos de 8 px (`gap-8`, `py-20 sm:py-28`).
- Tokens `text-display-m`, `text-display-s` añadidos para compatibilidad.

### 4. Imágenes

- Placeholder mesh + icono cuando no hay asset o falla `onError`.
- Variante `landscape` (4:3) para bloque de contenido destacado.

### 5. Animaciones

- Solo CSS: transitions, opacity, transform, hover, focus.
- Sin Framer Motion ni librerías nuevas.

## Archivos tocados

| Archivo | Cambio |
| --- | --- |
| `src/app/globals.css` | Sistema CSS portal premium v2 |
| `src/components/portal/layout/PortalHeader.tsx` | Grid, nav centrado, CTAs custom |
| `src/components/portal/layout/PortalMobileNav.tsx` | CTAs alineados al sistema premium |
| `src/components/portal/PortalBrandMark.tsx` | Logo SEM más grande, separador elegante |
| `src/components/portal/PortalHero.tsx` | Layout ampliado, CTAs diferenciados |
| `src/components/portal/PortalHeroMedia.tsx` | **Nuevo** — media segura + placeholder |
| `src/components/portal/PortalHeroBenefits.tsx` | Iconografía unificada |
| `src/components/portal/PortalSectionHeader.tsx` | H2 `text-display-l`, más aire |
| `src/components/portal/layout/PortalContainer.tsx` | Padding secciones ampliado |
| `src/components/portal/PortalShell.tsx` | Offset main con `--portal-header-height` |
| `src/components/portal/PortalHome.tsx` | Grids 8px, media placeholder en texto |

## Responsive validado

Breakpoints objetivo: 1920, 1440, 1280, 1024, 768, 390 px.

- Nav desktop desde `xl` (1280 px).
- CTAs header desde `lg` (1024 px).
- Hero apilado en mobile; beneficios 1→2→4 columnas.

## Validación

```bash
npm run lint
npm run build
```

## Relacionado

- [OT-SEM-PORTAL-001](./OT-SEM-PORTAL-001.md) — Fase 1 Header + Hero
- [HOME-PREMIUM-SEM](../ux/HOME-PREMIUM-SEM.md) — Documentación UX
