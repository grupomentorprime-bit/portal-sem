# OT-GROWTH-UX-SHELL-002 — Unificar identidad y Shell Growth OS

| Campo | Valor |
| --- | --- |
| OT | OT-GROWTH-UX-SHELL-002 |
| Predecesora | OT-GROWTH-UX-SHELL-001 (diagnóstico) |
| Fecha | 2026-09-04 |
| Criterio APTO | Las superficies principales se reconocen como una misma familia Growth OS, mientras cada cliente conserva su identidad como Espacio, sin duplicar componentes ni design system |

## Objetivo

Aplicar el patrón visual maestro de UX-SHELL-001 reutilizando tokens, `components/ui`, AEK y Shell V2. No crear otro design system.

## Contrato

| Superficie | Identidad |
| --- | --- |
| Producto | **Growth OS** — wordmark estable (`ProductMark`); slot de isotipo preparado |
| Espacio | Nombre + logo desde `site_config` / switcher — contexto secundario en Shell V2 |
| `/platform` | Tema neutro (`PlatformNeutralTheme` / `--growth-os-*`); sin teñir con `--brand-*` del Espacio activo |
| `/admin` | Shell V2; Growth OS = producto; Espacio = contexto + acentos `--brand-*` |
| Login / sin Espacio / acceso denegado | `ProductAuthFrame` (misma familia) |

## Cambios

1. **Lenguaje** — Dashboard → Inicio (nav + breadcrumbs); copy CMS técnico visible → cotidiano (Panel protegido / Usuarios / equipo).
2. **Jerarquía** — TopBar/Sidebar: Growth OS primero; logo/nombre del Espacio en slot secundario.
3. **`/platform`** — `PlatformShell` + AEK (`AdminDataTable`, `EmptyState`, `StatusBadge`) + `Card`/`Button` ui; nav Espacios · Ir al Espacio.
4. **Auth states** — login, `/admin/sin-espacio`, forbidden de `/platform` usan `ProductAuthFrame`.
5. **Shell V1** — deprecado (`@deprecated`); default sigue V2; fallback con `ADMIN_SHELL_V2=false` conservado.

## Fuera de alcance

- Growth Core, permisos, provisión, datos de clientes
- Rediseño de módulos internos de `/admin`
- Isotipo definitivo Growth OS (slot listo; wordmark mientras tanto)

## Pruebas

```bash
npm run test:baseline
npx tsc --noEmit
npm run build
```

Validación manual: `/platform`, `/admin` SEM, `/admin` ADL, login, sin Espacio, responsive básico; SEM/ADL conservan identidad; `/platform` no cambia de color al cambiar Espacio.

## Criterios de aceptación

- [x] Inicio unificado en nav/breadcrumbs
- [x] Chrome Growth OS + Espacio secundario (site_config)
- [x] `/platform` aislado de brand del Espacio; AEK/ui reutilizado
- [x] Login / sin Espacio / acceso denegado homologados
- [x] Shell V1 deprecado sin eliminar compatibilidad
- [x] Baseline + typecheck + build

## Veredicto

**APTO** — superficies principales comparten familia Growth OS (`ProductMark` / `ProductAuthFrame` / `PlatformNeutralTheme` + Shell V2). Cada Espacio conserva logo/nombre/acentos vía `site_config`. `/platform` no hereda `--brand-*` del Espacio activo. Lenguaje Inicio; copy CMS técnico visible atenuado. Shell V1 deprecado, fallback con flag. `test:baseline` 151 pass, `tsc --noEmit`, `npm run build`.
