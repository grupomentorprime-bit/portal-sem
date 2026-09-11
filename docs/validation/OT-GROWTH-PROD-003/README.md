# OT-GROWTH-PROD-003 — Créditos y defaults de plataforma

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-PROD-003 |
| ADR | [ADR-009](../../architecture/ADR-009.md) |
| Fecha | 2026-09-04 |
| Criterio APTO | Ninguna superficie visible de plataforma presenta este producto como Learning OS, Portal SEM o Aprende Hoy |

## Objetivo

Que Growth OS se nombre como producto en créditos, footer técnico, design system, AEK, placeholders y defaults. El cliente visible es el nombre del Espacio; si falta, Growth OS.

No reescribe documentación histórica (PROD-004). No toca pack SEM/IPN válido ni el adapter académico Aprende Hoy.

## Contrato

| Superficie | Destino |
| --- | --- |
| Producto | **Growth OS** (`PLATFORM_DISPLAY_NAME` / `PLATFORM_CREDITS`) |
| Cliente | Nombre del Espacio desde `site_config` |
| Sin nombre de Espacio | Growth OS |
| Créditos legado en DB | `rewriteLegacyPlatformProductName` al leer/mostrar |
| Pack T001 | SEM/IPN intacto; solo se sustituye el nombre de *este* producto en créditos |
| Aprende Hoy | Adapter y copy T001 de handoff académico intactos |

## Fuera de alcance

- Docs de entrada (README, Handbook) — PROD-004
- Contenido editorial SEM/IPN (home, admisión FAQ académica, generaciones)
- Adapter `AprendeHoyAdmissionAdapter`
- Growth Core, planes, onboarding self-serve

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

## Criterios de aceptación

- [x] Defaults / créditos de plataforma = Growth OS
- [x] Placeholders y catálogos AEK / design system sin Learning OS, Portal SEM ni AprendeHoy como este producto
- [x] SEM conserva Seminario, IPN y pack T001
- [x] ADL / Espacio vacío no heredan branding ni nombres SEM
- [x] Copy T001 y adapter que hablan de Aprende Hoy como sistema académico intactos
- [x] Búsqueda runtime de nombres legacy en `src/` y `scripts/` (exentos: helper de rewrite, pack T001, adapter)

## Veredicto

**APTO** — créditos, placeholders, design system/AEK y defaults de plataforma dicen Growth OS. SEM conserva pack T001/IPN; ADL no hereda nombres SEM; adapter Aprende Hoy intacto. `test:baseline` 107 tests (93 pass, 14 smoke skip sin app viva), `tsc --noEmit`, `npm run build`.
