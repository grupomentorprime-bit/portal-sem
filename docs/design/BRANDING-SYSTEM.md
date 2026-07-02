# BRANDING-SYSTEM.md — Sistema Corporativo de Marca SEM

**Código:** OT-BRANDING-002  
**Versión:** 1.0  
**Estado:** Activo  
**Dependencia:** OT-BRANDING-001 (Auditoría)

---

## Filosofía

La identidad visual del Seminario Eclesiástico Mayor (SEM) se expresa mediante **cinco colores institucionales** y una escala neutra derivada. Toda la plataforma AprendeHoy debe consumir **exclusivamente variables CSS** — nunca valores HEX, RGB o HSL escritos directamente en componentes.

Principios:

1. **Una sola fuente de verdad** — `src/styles/tokens/brand.css`
2. **Alias universales** — `src/styles/tokens/colors.css` traduce marca → semántica
3. **Cero sorpresas visuales** — los tokens existentes mantienen retrocompatibilidad (`--primary`, `--color-primary`)
4. **Validación automática** — CI bloquea colores no autorizados
5. **Migración progresiva** — deuda legacy registrada en `scripts/branding-baseline.json`

---

## Arquitectura de tokens

```
globals.css
  ├── tokens/brand.css      ← 5 colores SEM (único HEX de marca)
  ├── tokens/colors.css     ← alias, grises, estados UI
  ├── design-tokens.css     ← tipografía, motion, sombras, layout
  └── Experience Kit…       ← cursor, hero, footer, etc.
```

### Cadena de consumo

```
brand.css (--sem-*)
    ↓
colors.css (--color-*, --gray-*, --state-*)
    ↓
design-tokens.css (tipografía, sombras…)
    ↓
Componentes (var(--color-primary), bg-primary, etc.)
```

---

## Tokens oficiales de marca

Definidos **únicamente** en `src/styles/tokens/brand.css`:

| Variable CSS | HEX | Rol |
| --- | --- | --- |
| `--sem-primary` | `#002A47` | Primario |
| `--sem-secondary` | `#246AA1` | Secundario |
| `--sem-accent` | `#10BCE2` | Acento |
| `--sem-success` | `#3ED6AF` | Complementario |
| `--sem-light` | `#8CE27F` | Complementario claro |

**No agregar nuevos colores a `brand.css`.**

---

## Alias universales

Definidos en `src/styles/tokens/colors.css`:

| Variable | Resuelve a |
| --- | --- |
| `--color-primary` | `var(--sem-primary)` |
| `--color-secondary` | `var(--sem-secondary)` |
| `--color-accent` | `var(--sem-accent)` |
| `--color-success` | `var(--sem-success)` |
| `--color-warning` | `var(--sem-light)` |
| `--color-brand` | `var(--sem-primary)` |
| `--color-link` | `var(--sem-secondary)` |
| `--color-action` | `var(--sem-accent)` |
| `--primary` | `var(--color-primary)` (legacy) |
| `--secondary` | `var(--color-secondary)` (legacy) |

---

## Escala neutra

Usar **exclusivamente** `--gray-50` … `--gray-900` definidos en `colors.css`.

| Token | Uso típico |
| --- | --- |
| `--gray-50` / `--gray-100` | Fondos suaves |
| `--gray-200` / `--gray-300` | Bordes |
| `--gray-500` / `--gray-600` | Texto secundario |
| `--gray-900` | Texto principal |

### Prohibido en componentes nuevos

- `zinc-*`, `slate-*`, `stone-*`, `neutral-*` (Tailwind genérico)
- Sustituir por `--gray-*` o tokens semánticos (`--border`, `--text-muted`)

---

## Estados UI

Variables normalizadas en `colors.css`. Los componentes **nunca** usan HEX para estados.

| Estado | Variables |
| --- | --- |
| Success | `--state-success-fg`, `--state-success-bg`, `--state-success-border` |
| Warning | `--state-warning-fg`, `--state-warning-bg`, `--state-warning-border` |
| Danger | `--state-danger-fg`, `--state-danger-bg`, `--state-danger-border` |
| Info | `--state-info-fg`, `--state-info-bg`, `--state-info-border` |

El color de error (`--color-danger`) es el único rojo autorizado en tokens, por accesibilidad WCAG.

---

## Colores permitidos

| Categoría | Dónde se define | En componentes |
| --- | --- | --- |
| Marca (5) | `brand.css` | `var(--sem-*)` o `var(--color-*)` |
| Neutros | `colors.css` | `var(--gray-*)`, `var(--border)` |
| Superficies | `colors.css` | `var(--background)`, `var(--surface)` |
| Estados | `colors.css` | `var(--state-*)`, `var(--color-danger)` |
| Blanco/negro utilitario | — | `#fff` / `#000` solo en casos excepcionales documentados |

---

## Colores prohibidos

Queda **prohibido** introducir (salvo justificación documentada en OT de migración):

| Color / patrón | Motivo |
| --- | --- |
| `#041525` | Navy alternativo (Premium Theme) |
| `#14C9C3` | Teal no oficial (sustituto de acento) |
| `#0EA5C9` / `#0EA5E9` | Cyan Tailwind / Sky |
| `#0577B8` | Blue genérico |
| `#C9A227` / `#B8921F` | Dorado / amber decorativo |
| `#FFF4CC` | Amarillo / crema |
| `#2563EB` / `#3B82F6` | Blue Tailwind |
| Clases `amber-*`, `yellow-*`, `orange-*`, `gold` | Fuera de identidad |
| Clases `bg-blue-*`, `bg-sky-*`, `bg-cyan-*`, `bg-indigo-*` | Fuera de identidad |

**Excepción:** estados de error/advertencia/éxito deben usar tokens `--state-*` o `--color-danger`, no paletas Tailwind genéricas.

---

## Ejemplos

### Correcto

```css
.hero-title {
  color: var(--sem-primary);
}

.card-cta {
  background: var(--color-action);
  border: 1px solid var(--border);
}

.alert-success {
  background: var(--state-success-bg);
  border-color: var(--state-success-border);
  color: var(--state-success-fg);
}
```

```tsx
<button className="bg-primary text-text-inverse hover:bg-secondary">
  Postular
</button>
```

### Incorrecto

```css
/* ❌ HEX hardcodeado */
.nav-link--active {
  color: #14C9C3;
}

/* ❌ Dorado prohibido */
.badge-price {
  background: #C9A227;
}
```

```tsx
/* ❌ Tailwind genérico */
<div className="bg-zinc-900 text-amber-500" />

/* ❌ Inline sin var() */
<div style={{ background: "#041525" }} />
```

---

## Validador

Script: `scripts/check-branding.ts`

```bash
# Validación CI (modo estricto — 0 incidencias)
npm run check:branding

# Deprecado: actualizar baseline legacy (solo mantenimiento histórico)
npx tsx scripts/check-branding.ts --update-baseline
```

Salida en error:

```
Branding Validation Error
  src/components/example.tsx:42  [hex] #14c9c3
```

---

## CI

El pipeline ejecuta `npm run check:branding` antes del build. Cualquier color no autorizado provoca:

```
Build Failed — Branding Validation Error
```

---

## Estado de migración

| OT | Alcance | Estado |
| --- | --- | --- |
| OT-BRANDING-001 | Auditoría corporativa | ✅ |
| OT-BRANDING-002 | Infraestructura tokens + validador | ✅ |
| OT-BRANDING-003 | Portal público | ✅ |
| OT-BRANDING-004 | Panel administrativo CMS | ✅ |

`scripts/branding-baseline.json`: **0 entradas** (modo estricto activo desde OT-BRANDING-004).

Próximo paso sugerido: **OT-BRANDING-005** — gobernanza permanente del Design System. ✅ Completada — ver [OT-BRANDING-005](../ot/OT-BRANDING-005.md).

---

## Referencias

- Auditoría: `docs/audits/AUDIT-CORPORATE-BRANDING-001.md`
- OT Foundation: `docs/ot/OT-BRANDING-002.md`
- OT Admin: `docs/ot/OT-BRANDING-004.md`
- OT Gobernanza: `docs/ot/OT-BRANDING-005.md`
- Experience Kit: `docs/design/INTRODUCTION.md`
- Design System: `docs/design/DESIGN-SYSTEM.md`
