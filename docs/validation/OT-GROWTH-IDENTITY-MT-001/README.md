# OT-GROWTH-IDENTITY-MT-001 — Identidad multi-tenant (Master ≠ Espacio)

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-IDENTITY-MT-001 |
| Fecha | 2026-09-04 |
| Predecesoras | [SAAS-006](../OT-GROWTH-SAAS-006/README.md), [SAAS-009](../OT-GROWTH-SAAS-009/README.md), [UX-SHELL-002](../OT-GROWTH-UX-SHELL-002/README.md) |
| Criterio APTO | Growth OS Master en `/platform`; cada Espacio toma identidad de `site_config`; aislamiento verificado; un solo motor de edición |

## Contrato

| Capa | Superficie | Fuente |
| --- | --- | --- |
| Growth OS Master | `/platform`, login global, sin Espacio | `--growth-os-*` + `PlatformNeutralTheme` |
| Espacio | `/admin` + portal del Site | `site_config.branding` → `--brand-*` |

**Edición:** `/admin/config?section=branding` (`BrandingPanel`) + `PUT /api/cms/config` con `settings.update` del Espacio activo. No Platform Admin. No segundo motor.

**Prohibido:** hardcodes SEM/ADL; paleta global compartida por clientes; branding de cliente en config global; `--brand-*` del Espacio en `/platform`; Master sobrescribiendo `site_config`.

## Implementación (ya existente — preservar)

| Pieza | Ubicación |
| --- | --- |
| Master CSS | `src/styles/tokens/brand.css` |
| Aislamiento platform | `PlatformNeutralTheme` → `PlatformShell` / `ProductAuthFrame` |
| Inyección Espacio | `buildBrandThemeStyle` + `src/app/layout.tsx` |
| Packs dato | `SEM_SITE_IDENTITY`, `ADL_SITE_IDENTITY` |
| Editor | `BrandingPanel` en `ConfigurationHub` |
| Docs canónicos | [BRANDING-SYSTEM.md](../../design/BRANDING-SYSTEM.md) |

## Validación

```bash
npm run test:baseline -- tests/baseline/saas-branding.test.ts tests/baseline/ux-shell-identity.test.ts tests/baseline/saas-adl-tenant.test.ts
```

| Caso | Esperado |
| --- | --- |
| Master ≠ SEM ≠ ADL (primarios) | HEX distintos |
| `/platform` | `PlatformNeutralTheme` fuerza `--growth-os-*` |
| SEM `/admin` | `--brand-*` desde pack / `site_config` SEM |
| ADL `/admin` | `--brand-*` distinto de SEM |
| Fixture temporal | cambiar color de tenant de prueba; SEM, ADL y Master intactos; fixture borrado |

Manual (hosts locales): `/platform` · SEM `/admin` · ADL `/admin` (`adl.localhost`) · sección Identidad visual.

## Veredicto

**CERRADA · APTO** — contrato Growth OS Master ≠ identidad del Espacio **congelado**. Sin más cambios de branding, tokens, BrandingPanel, `site_config`, packs SEM/ADL ni aislamiento multi-tenant.

Co-congelación 2026-09-04: [OT-GROWTH-UX-SHELL-003](../OT-GROWTH-UX-SHELL-003/README.md) **CERRADA · APTO VISUAL**. No reabrir branding / Shell / Platform Admin / APIs / seguridad / MT salvo OT futura explícita.
