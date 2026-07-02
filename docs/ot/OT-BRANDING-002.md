# OT-BRANDING-002 — Activación del Sistema Corporativo de Marca (Foundation)

| Atributo | Valor |
| --- | --- |
| OT | OT-BRANDING-002 |
| Prioridad | 🔴 Crítica |
| Tipo | Arquitectura UI / Branding Foundation |
| Dependencia | OT-BRANDING-001 ✅ |
| Estado | Completada |
| Fecha cierre | 2026-07-01 |

---

## Objetivo

Convertir la identidad visual del SEM en el **único sistema de colores autorizado** para AprendeHoy, construyendo la infraestructura sobre la cual trabajarán todas las futuras OTs de UX — **sin modificar el diseño de ninguna pantalla**.

---

## Problema (OT-BRANDING-001)

- 143 colores distintos en la plataforma
- 138 fuera de identidad corporativa
- Coexistencia de tres sistemas: SEM Corporate, Premium Theme, Tailwind Default

---

## Alcance ejecutado

| # | Requisito | Entregable | Estado |
| --- | --- | --- | --- |
| 1 | Activar `brand.css` antes del Experience Kit | `globals.css` import chain | ✅ |
| 2 | Tokens oficiales (5 colores) | `src/styles/tokens/brand.css` | ✅ |
| 3 | Alias universales | `src/styles/tokens/colors.css` | ✅ |
| 4 | Escala neutra única `--gray-*` | `colors.css` | ✅ |
| 5 | Estados UI normalizados | `--state-*` en `colors.css` | ✅ |
| 6 | Eliminar HEX en infraestructura | `design-tokens.css` refactorizado | ✅ |
| 7 | Documentación colores prohibidos | `docs/design/BRANDING-SYSTEM.md` | ✅ |
| 8 | Validador automático | `scripts/check-branding.ts` | ✅ |
| 9 | CI pipeline | `.github/workflows/branding.yml` + `npm run check:branding` | ✅ |
| 10 | Documentación OT | Este documento | ✅ |

### Fuera de alcance (respetado)

No se modificó: Hero, Header, Footer, Programas, CTA, Contacto, Componentes, Layout, CMS, Experience Kit.

---

## Arquitectura implementada

```
globals.css
  @import tokens/brand.css      ← --sem-* (5 HEX únicos de marca)
  @import tokens/colors.css     ← alias, grises, estados
  @import design-tokens.css     ← tipografía, motion, sombras
  @import cursor.css            ← Experience Kit inicia aquí
  …
```

---

## Criterios de aceptación

| Criterio | Estado |
| --- | --- |
| Colores corporativos provienen exclusivamente de brand.css | ✅ |
| Infraestructura de tokens sin HEX duplicados en design-tokens.css | ✅ |
| Alias `--color-*` apuntan a `--sem-*` | ✅ |
| Escala neutra única `--gray-*` | ✅ |
| Estados UI via variables | ✅ |
| Validador detecta colores no autorizados | ✅ |
| CI falla en violaciones nuevas | ✅ |
| Sin cambio visual respecto al estado anterior | ✅ |

> **Nota:** Componentes legacy conservan HEX hardcodeado (deuda registrada en `scripts/branding-baseline.json`, 291 entradas). El validador bloquea **nuevas** violaciones; OTs futuras reducirán el baseline.

---

## Comandos

```bash
npm run check:branding                    # CI
npx tsx scripts/check-branding.ts --strict   # auditoría completa
npx tsx scripts/check-branding.ts --update-baseline  # tras migración
```

---

## Próximas OTs sugeridas

| OT | Alcance |
| --- | --- |
| OT-BRANDING-003 | Migración Hero + Header premium |
| OT-BRANDING-004 | Migración Programas (eliminar dorado) |
| OT-BRANDING-005 | Migración Admin CMS (zinc → --gray-*) |
| OT-BRANDING-006 | Baseline cero + CI `--strict` |

---

## Referencias

- `docs/design/BRANDING-SYSTEM.md`
- `docs/audits/AUDIT-CORPORATE-BRANDING-001.md`
- `scripts/branding-baseline.json`
