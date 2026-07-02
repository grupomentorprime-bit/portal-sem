# OT-BRANDING-003 — Migración Completa del Portal Público a Identidad Corporativa SEM

| Atributo | Valor |
| --- | --- |
| OT | OT-BRANDING-003 |
| Prioridad | 🔴 Muy Alta |
| Dependencia | OT-BRANDING-002 ✅ |
| Estado | Completada |
| Fecha cierre | 2026-07-01 |

---

## Objetivo

Eliminar la deuda de branding del portal público: Hero, Header, Footer, Programas, CTA, Contacto y componentes compartidos consumen exclusivamente tokens `--sem-*` / alias `--color-*`.

---

## Alcance ejecutado

| Área | Archivos | Estado |
| --- | --- | --- |
| Hero premium | `hero-premium.css`, `hero-home.css`, `compat.css` | ✅ |
| Header premium | `globals.css` (`.portal-header-premium--hero`, topbar, brand) | ✅ |
| Programas | `programs-home.css` | ✅ |
| Footer | `footer-home.css` (ya conforme), `globals.css` carousel/footer | ✅ |
| CTA | `cta-home.css`, `cta-premium.css` (conforme) | ✅ |
| Contacto | `contact-hub.css` (conforme) | ✅ |
| Cursor público | `cursor.css`, `cursor-defaults.ts` | ✅ |
| UI compartidos | `button`, `badge`, `footer`, `hero`, `skeleton`, `switch` | ✅ |
| Contenido demo | `seed.ts` (colores timeline → tokens) | ✅ |

### Fuera de alcance (respetado)

CMS admin, APIs, lógica funcional, responsive, Experience Kit (estructura).

---

## Mapeo aplicado

| Color legacy | Token destino |
| --- | --- |
| `#041525` | `var(--sem-primary)` |
| `#14C9C3` | `var(--sem-accent)` |
| `#0EA5C9` | `var(--sem-secondary)` |
| `#0577B8` | `var(--sem-secondary)` |
| `#C9A227` / dorado | `var(--sem-light)` |
| `#FFF4CC` | `color-mix(var(--sem-light), var(--text-inverse))` |
| Neutros header | `var(--gray-*)`, `var(--color-surface)` |

---

## Resultados de auditoría

| Métrica | Antes (OT-002) | Después (OT-003) |
| --- | ---: | ---: |
| Baseline branding | 291 | **90** |
| Colores prohibidos en portal público | 24+ | **0** |
| HEX en `src/styles/` (excl. tokens) | 46+ | **0** |

Deuda restante (90 entradas): panel administrativo CMS (`zinc-*`), workflows, media manager — fuera del alcance portal público.

```bash
npm run check:branding          # ✓ passed
npx tsx scripts/check-branding.ts --update-baseline  # 90 entradas
```

---

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Hero usa `var(--sem-*)` | ✅ |
| Header usa `var(--sem-*)` | ✅ |
| Footer usa tokens corporativos | ✅ |
| Programas sin dorado/amber | ✅ |
| CTA y Contacto conformes | ✅ |
| Colores prohibidos eliminados del portal público | ✅ |
| Baseline < 150 | ✅ (90) |
| Build + validación CI | ✅ |

---

## Próxima OT sugerida

**OT-BRANDING-004** — Migración panel administrativo CMS (`zinc-*` → `--gray-*`, estados → `--state-*`).

---

## Referencias

- `docs/audits/AUDIT-BRANDING-003.md`
- `docs/design/BRANDING-SYSTEM.md`
- `scripts/branding-baseline.json`
