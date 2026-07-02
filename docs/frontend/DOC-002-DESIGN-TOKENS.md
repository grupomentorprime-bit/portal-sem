# DOC-002 — Design Tokens

| Atributo | Valor |
| --- | --- |
| Código | DOC-002 |
| Versión | 1.0.0 |
| OT | OT-CORE-UI-003 |
| Épica | EP-CORE-001 |
| Estado | **LOCKED** |
| Fecha | 2026-06-30 |

> Sistema oficial de Design Tokens de AprendeHoy Learning OS. Única fuente de verdad para valores visuales. Gobierna todos los tenants.

---

## 1. Principio

**Ningún componente consume valores hardcodeados cuando existe un token oficial.**

Flujo obligatorio:

```text
Branding CMS
      ↓
layout.tsx (--brand-*)
      ↓
design-tokens.css (--color-*)
      ↓
Componentes (var(--color-primary), etc.)
```

Los componentes **nunca** leen `--brand-*` ni nombres de institución (`--sem-*`).

---

## 2. Estructura de archivos

```text
src/design/tokens/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radius.ts
├── shadow.ts
├── motion.ts
├── z-index.ts
├── breakpoints.ts
└── index.ts

src/styles/design-tokens.css    ← Variables CSS runtime
src/app/globals.css             ← Importa design-tokens.css
src/design/index.ts             ← Re-export público
```

---

## 3. Colores semánticos

| Token CSS | TS (`colorDefaults`) | Uso |
| --- | --- | --- |
| `--color-primary` | primary | Marca principal |
| `--color-secondary` | secondary | Acciones secundarias |
| `--color-accent` | accent | Destacados, foco |
| `--color-success` | success | Confirmación |
| `--color-warning` | warning | Advertencias |
| `--color-danger` | danger | Errores |
| `--color-info` | info | Información |
| `--color-surface` | surface | Superficies elevadas |
| `--color-background` | background | Fondo página |
| `--color-foreground` | foreground | Texto principal |
| `--color-border` | border | Bordes |
| `--color-muted` | muted | Texto secundario |

### Alias legacy (retrocompatibilidad)

| Legacy | Canónico |
| --- | --- |
| `--primary` | `var(--color-primary)` |
| `--secondary` | `var(--color-secondary)` |
| `--text` | `var(--color-foreground)` |
| `--text-muted` | `var(--color-muted)` |
| `--text-inverse` | `var(--color-surface)` |

### Branding CMS

| Variable inyectada (`layout.tsx`) | Mapeo en `body` |
| --- | --- |
| `--brand-primary` | `--color-primary` |
| `--brand-secondary` | `--color-secondary` |
| `--brand-background` | `--color-background`, `--color-surface` |
| `--brand-text` | `--color-foreground` |

---

## 4. Tipografía

| Token | CSS var | Escala |
| --- | --- | --- |
| Display XL | `--font-display-xl` | `clamp(2.5rem, 5vw, 4rem)` |
| Display | `--font-display` | `clamp(2rem, 4vw, 3rem)` |
| Heading | `--font-heading` | `clamp(1.5rem, 2.5vw, 2.25rem)` |
| Title | `--font-title` | `clamp(1.25rem, 2vw, 1.5rem)` |
| Subtitle | `--font-subtitle` | `clamp(1.0625rem, 1.5vw, 1.25rem)` |
| Body | `--font-body` | `1rem` |
| Caption | `--font-caption` | `0.875rem` |
| Overline | `--font-overline` | `0.75rem` |
| Label | `--font-label` | `0.8125rem` |

Clases utilitarias existentes (`text-display-l`, `text-body`, etc.) en `globals.css` consumen estos valores.

---

## 5. Espaciado

| Token | CSS var | Valor |
| --- | --- | --- |
| 0 | `--space-0` | 0 |
| XS | `--space-xs` | 4px |
| SM | `--space-sm` | 8px |
| MD | `--space-md` | 16px |
| LG | `--space-lg` | 24px |
| XL | `--space-xl` | 32px |
| 2XL | `--space-2xl` | 48px |
| 3XL | `--space-3xl` | 64px |
| 4XL | `--space-4xl` | 96px |

---

## 6. Border radius

| Token | CSS var | Valor |
| --- | --- | --- |
| 2 | `--radius-2` | 2px |
| 4 / sm | `--radius-4` / `--radius-sm` | 4px |
| 6 | `--radius-6` | 6px |
| 8 / md | `--radius-8` / `--radius-md` | 8px |
| 12 / lg | `--radius-12` / `--radius-lg` | 12px |
| 16 / xl | `--radius-16` / `--radius-xl` | 16px |
| 20 | `--radius-20` | 20px |
| 24 / 2xl | `--radius-24` / `--radius-2xl` | 24px |
| pill / full | `--radius-pill` / `--radius-full` | 9999px |

---

## 7. Sombras

| Token | CSS var |
| --- | --- |
| XS | `--shadow-xs` |
| SM | `--shadow-sm` |
| MD | `--shadow-md` |
| LG | `--shadow-lg` |
| XL | `--shadow-xl` |

---

## 8. Motion

| Token | CSS var | Valor |
| --- | --- | --- |
| Fast | `--motion-fast` | 150ms |
| Normal | `--motion-normal` | 250ms |
| Slow | `--motion-slow` | 350ms |
| Hero | `--motion-hero` | 600ms |
| Carousel | `--motion-carousel` | 500ms |
| Modal | `--motion-modal` | 300ms |
| Hover | `--motion-hover` | 150ms |
| Focus | `--motion-focus` | 100ms |

Curvas: `--ease-default`, `--ease-in`, `--ease-out`, `--ease-hero`, `--ease-carousel`.

---

## 9. Z-Index

| Nivel | CSS var | Valor |
| --- | --- | --- |
| Base | `--z-base` | 0 |
| Dropdown | `--z-dropdown` | 100 |
| Sticky | `--z-sticky` | 200 |
| Overlay | `--z-overlay` | 400 |
| Modal | `--z-modal` | 500 |
| Toast | `--z-toast` | 800 |
| Tooltip | `--z-tooltip` | 900 |

Legacy: `--z-fixed` (300), `--z-popover` (600).

---

## 10. Breakpoints oficiales

Importar desde `@/design/tokens/breakpoints` o `@/design`.

| Clave | px |
| --- | ---: |
| bp360 | 360 |
| bp390 | 390 |
| bp414 | 414 |
| bp480 | 480 |
| bp640 | 640 |
| bp768 | 768 |
| bp820 | 820 |
| bp912 | 912 |
| bp1024 | 1024 |
| bp1200 | 1200 |
| bp1366 | 1366 |
| bp1440 | 1440 |
| bp1536 | 1536 |
| bp1600 | 1600 |
| bp1920 | 1920 |
| bp2560 | 2560 |

Helpers: `minWidth(n)`, `maxWidth(n)`.

**Excepción documentada:** Hero Premium usa breakpoints aprobados en `hero-breakpoints.ts` (OT-CORE-UI-004 las alineará).

---

## 11. Eliminación `--sem-*` (OT-CORE-UI-003)

| Variable eliminada | Reemplazo semántico |
| --- | --- |
| `--sem-navy` | `--color-primary` |
| `--sem-navy-2` | `--color-primary` |
| `--sem-teal` | `--color-accent` |
| `--sem-blue` | `--color-secondary` |
| `--sem-white` | `--text-inverse` |
| `--sem-muted` | `--text-muted` |

Archivos actualizados: `design-tokens.css` (sin definición `--sem-*`), `globals.css`, `hero-premium.css`.

---

## 12. Auditoría de colores hardcodeados

### Resueltos en OT-003

- Variables `--sem-*` en Core CSS → tokens semánticos.

### Pendientes documentados (no modificar Header/Hero en esta OT)

| Ubicación | Casos | Token sugerido | OT futura |
| --- | --- | --- | --- |
| `globals.css` `.portal-header-premium--hero` | ~25 hex (`#061f35`, `#14c9c3`, etc.) | `--color-primary`, `--color-accent`, `--gray-*` | OT-CORE-UI-006 / Header v1.1 |
| `globals.css` `.portal-topbar` | `#041525` background | `--color-primary` | OT-CORE-UI-005 |
| `hero-premium.css` | Fallbacks en `color-mix(..., #fff)` | `--text-inverse` | OT-CORE-UI-004 |
| `preview-adapters.ts` | `#002A47` overlay | `colorDefaults.primary` | OT-CORE-UI-002 follow-up |
| Admin (`ColorPicker`, CMS editors) | Placeholders hex | Aceptable — inputs de color | — |

### Componentes TSX

La mayoría de componentes portal usan clases Tailwind (`text-primary`, `bg-accent`) que resuelven a tokens vía `@theme inline`. No se detectaron hex en `src/components/portal/` (excepto admin preview).

---

## 13. Reglas de uso

1. CSS: `var(--color-primary)`, nunca `#002A47` en componentes nuevos.
2. TS: importar `colorDefaults`, `breakpoints`, etc. desde `@/design`.
3. No usar `--brand-*` en componentes — solo en `layout.tsx`.
4. No crear variables `--{tenant}-*`.
5. Nuevos tokens requieren actualizar `tokens/*.ts` + `design-tokens.css` + este documento.

---

## 14. Referencias

- [CORE-UI-CANON.md](./CORE-UI-CANON.md)
- [OT-CORE-UI-003.md](../ot/OT-CORE-UI-003.md)
- `src/styles/design-tokens.css`
- `src/design/tokens/`
