# AUDIT-BRANDING-003 — Verificación Post-Migración Portal Público

| Atributo | Valor |
| --- | --- |
| Código | OT-BRANDING-003 |
| Dependencia | OT-BRANDING-002 |
| Fecha | 2026-07-01 |
| Alcance | Portal público AprendeHoy |

---

## Resumen ejecutivo

La migración OT-BRANDING-003 eliminó **todos los colores prohibidos y HEX hardcodeados** del portal público. El baseline de branding se redujo de **291 a 90 entradas** (−69 %), cumpliendo el objetivo de menos de 150.

El portal público consume exclusivamente la cadena de tokens:

```
brand.css (--sem-*)
  → colors.css (--color-*, --gray-*)
    → componentes / CSS premium
```

---

## Verificación por superficie

| Superficie | Clasificación pre | Clasificación post | HEX prohibidos |
| --- | --- | --- | --- |
| Hero premium | C | **A** | 0 |
| Header premium | C | **A** | 0 |
| Topbar | C | **A** | 0 |
| Programas destacados | C | **A** | 0 |
| CTA home | B | **A** | 0 |
| Footer home | A | **A** | 0 |
| Contact hub | A | **A** | 0 |
| Cursor premium | C | **A** | 0 |
| UI Button/Badge/Footer | B | **A** | 0 |

---

## Colores prohibidos — portal público

| Color | Estado |
| --- | --- |
| `#041525` | ✅ Eliminado |
| `#14C9C3` | ✅ Eliminado |
| `#0EA5C9` | ✅ Eliminado |
| `#0577B8` | ✅ Eliminado |
| `#C9A227` | ✅ Eliminado |
| `#B8921F` | ✅ Eliminado |
| `#FFF4CC` | ✅ Eliminado |

---

## Archivos migrados

### Estilos

- `src/styles/hero-premium.css`
- `src/styles/cursor.css`
- `src/styles/home-premium/hero-home.css`
- `src/styles/home-premium/compat.css`
- `src/styles/home-premium/cta-home.css`
- `src/styles/home-premium/programs-home.css`
- `src/app/globals.css` (header, topbar, carousel)

### Componentes UI

- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/footer.tsx`
- `src/components/ui/hero.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/switch.tsx`

### Datos

- `src/lib/portal/cursor-defaults.ts`
- `src/lib/content/seed.ts`

---

## Baseline restante (90 entradas)

Deuda confinada al **panel administrativo** y módulos internos:

| Área | Entradas aprox. |
| --- | ---: |
| CMS layout (`zinc-*`) | ~55 |
| Media manager (`amber-*`, `emerald-*`) | ~20 |
| Workflows (`#3B82F6`, `#F59E0B`, etc.) | ~10 |
| Identity / events admin | ~5 |

No afecta al portal público ni a la identidad visible del visitante.

---

## Comandos de verificación

```bash
npm run check:branding
npm run build
npx tsx scripts/check-branding.ts --strict  # falla en deuda admin (esperado)
```

---

## Validación visual

Composición, layout, responsive y animaciones **sin cambios estructurales**. Los colores visibles migran a la paleta oficial SEM:

- Acento: `#10BCE2` (antes `#14C9C3` en hero/header)
- Primario: `#002A47` (antes `#041525` en fondos)
- Secundario: `#246AA1` (antes `#0577B8` / `#0EA5C9` en gradientes)

Verificar en breakpoints: 1920, 1600, 1440, 1366, 1280, 1024, 768, 430, 390 px.

---

## Referencias

- `docs/ot/OT-BRANDING-003.md`
- `docs/audits/AUDIT-CORPORATE-BRANDING-001.md`
- `docs/design/BRANDING-SYSTEM.md`
